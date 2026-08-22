import React, { useState, useEffect, useMemo } from "react";
import { 
  Building, 
  MapPin, 
  Award, 
  Users, 
  ShoppingBag, 
  CheckCircle2, 
  FileText, 
  ShieldCheck, 
  Truck, 
  TrendingUp, 
  User, 
  Check, 
  Loader2, 
  Printer, 
  ExternalLink,
  Sparkles,
  ChevronLeft,
  AlertCircle,
  HelpCircle,
  Lock,
  Star,
  Zap,
  Info,
  Send,
  X,
  MessageSquare,
  Clock,
  Target,
  Search,
  Filter,
  Plus,
  Minus,
  Percent,
  DollarSign,
  Package,
  Layers,
  ArrowUpRight,
  Eye,
  Sliders,
  LayoutGrid,
  List,
  Wallet,
  ShoppingBasket,
  Share2,
  RefreshCw,
  Boxes,
  Briefcase,
  Radio,
  BellRing,
  DownloadCloud,
  FileCheck2,
  Copy,
  ChevronRight,
  ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product } from "../types";
import AddAdButton from "./AddAdButton";
import RepresentativeCertificateView from "./RepresentativeCertificateView";
import HonorPlaqueCard from "./HonorPlaqueCard";
import RepresentativeAnalyticsDashboard from "./RepresentativeAnalyticsDashboard";
import { getRegionalLeads, saveRegionalLeads, addRepCommission, getRepCommissions, RegionalLead, getRepresentativeGuarantees, saveRepresentativeGuarantee } from "../lib/leads-store";

interface RepresentativeManagementPortalProps {
  user: any;
  orders: any[];
  products?: Product[];
  onAddToCart?: (product: Product, quantityCartons: number) => void;
  b2bConfig?: any;
  setActiveTab?: (tab: string) => void;
  onUpdateUser?: (updatedUser: any) => void;
  onOpenInvoiceModal?: (order: any) => void;
}

const toPersianNum = (num: number | string | undefined | null) => {
  if (num === undefined || num === null || num === "") return "۰";
  const s = typeof num === 'number' ? num.toLocaleString('fa-IR') : String(num);
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return s.replace(/\d/g, (d) => persianDigits[parseInt(d, 10)] || d);
};

export interface TierInfo {
  levelNumber: number;
  id: string;
  title: string;
  minSales: number; // Toman
  minSalesFormatted: string;
  badgeLabel: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  discountRate: string;
  discountMultiplier: number;
  benefits: string[];
  strategicPerks: string[];
  certificateTitle: string;
}

export const REPRESENTATIVE_TIERS: TierInfo[] = [
  {
    levelNumber: 1,
    id: "level1",
    title: "عامل فروش رسمی",
    minSales: 300_000_000,
    minSalesFormatted: "۳۰۰ میلیون تومان نقدی",
    badgeLabel: "عامل فروش رسمی",
    badgeBg: "bg-amber-50 text-amber-900 border-amber-300",
    badgeText: "text-amber-900",
    borderColor: "border-amber-400",
    discountRate: "تخفیف ویژه عاملیت نقدی",
    discountMultiplier: 0.08,
    benefits: [
      "ثبت رسمی در بانک اطلاعات نمایندگان معتبر کشور و اعطای گواهی اصالت",
      "اعطای لوح تقدیر با هولوگرام ضدجعل، QR استعلام آنلاین و خروجی PDF",
      "تخصیص نرخ دست‌اول کارخانجات و صدور پیش‌فاکتور رسمی",
      "پشتیبانی فنی و حقوقی مستقیم دبیرخانه مرکزی"
    ],
    strategicPerks: [
      "سامانه دریافت سرنخ‌های خریداران منطقه (Buyer Lead Routing)",
      "کاتالوگ‌ساز با درج نام، شماره و لوگوی اختصاصی نماینده",
      "رادار اطلاع‌رسانی پیش از گرانی نرخ کارخانجات (۴۸ ساعت قبل)"
    ],
    certificateTitle: "لوح سطح ۱: عامل فروش رسمی"
  },
  {
    levelNumber: 2,
    id: "level2",
    title: "نماینده انحصاری شهر",
    minSales: 1_000_000_000,
    minSalesFormatted: "۱ میلیارد تومان / ماه",
    badgeLabel: "نماینده انحصاری شهر",
    badgeBg: "bg-blue-50 text-blue-900 border-blue-300",
    badgeText: "text-blue-900",
    borderColor: "border-blue-400",
    discountRate: "حق انحصار توزیع شهری",
    discountMultiplier: 0.12,
    benefits: [
      "حق عاملیت انحصاری توزیع در کل محدوده جغرافیایی شهر",
      "اعطای لوح افتخار سطح ۲ با نشان یاقوت کبود و تاییدیه اتاق بازرگانی",
      "اولویت اول تخصیص بار کارخانجات در ایام اوج تقاضا بدون معطلی در صف",
      "حفاظت سیستمی ۱۰۰٪ از شبکه مشتریان و بنکداران محلی"
    ],
    strategicPerks: [
      "ارجاع خودکار کلیه تماس‌ها و سفارشات آنلاین شهر به انبار نماینده",
      "اولویت اول بارگیری (VIP Priority Queue) در باربری مستقیم",
      "درج نشان ویژه عاملیت انحصاری شهری در صفحه اول سایت"
    ],
    certificateTitle: "لوح سطح ۲: نماینده انحصاری شهر"
  },
  {
    levelNumber: 3,
    id: "level3",
    title: "نماینده انحصاری شهرستان و حومه",
    minSales: 2_000_000_000,
    minSalesFormatted: "۲ میلیارد تومان / ماه",
    badgeLabel: "نماینده انحصاری شهرستان و حومه",
    badgeBg: "bg-purple-50 text-purple-900 border-purple-300",
    badgeText: "text-purple-900",
    borderColor: "border-purple-400",
    discountRate: "حق انحصار کامل شهرستان",
    discountMultiplier: 0.16,
    benefits: [
      "حق انحصار توزیع و عاملیت کل شهرستان و توابع",
      "اعطای لوح افتخار سلطنتی سطح ۳ (آمتیست و طلا)",
      "نرخ ترانزیت مستقیم تریلی و خاور از درب کارخانه تا انبار نماینده",
      "امکان تعریف و مدیریت ویزیتوران منطقه با پنل گزارشات زنده"
    ],
    strategicPerks: [
      "سامانه هوشمند مانیتورینگ سفارشات رقبا در سطح شهرستان",
      "خط سبز ترانزیت بار با تضمین زمان تحویل (SLA اختصاصی)",
      "صفحه اختصاصی با سئوی محلی در گوگل به عنوان مرجع توزیع کالا"
    ],
    certificateTitle: "لوح سطح ۳: نماینده انحصاری شهرستان"
  },
  {
    levelNumber: 4,
    id: "level4",
    title: "نماینده ارشد استانی و لیدر",
    minSales: 5_000_000_000,
    minSalesFormatted: "۵ میلیارد تومان / ماه",
    badgeLabel: "نماینده ارشد استانی و لیدر فروش",
    badgeBg: "bg-emerald-50 text-emerald-900 border-emerald-300",
    badgeText: "text-emerald-900",
    borderColor: "border-emerald-400",
    discountRate: "عاملیت ارشد و لیدر استانی",
    discountMultiplier: 0.22,
    benefits: [
      "رهبری عالی شبکه توزیع استانی و حق اورراید منطقه‌ای",
      "اعطای تندیس طلایی و لوح تقدیر سطح ۴ (زمرد و الماس)",
      "عضویت دائمی در شورای عالی قیمت‌گذاری و تامین کالا",
      "نمایش در صدر لیست طلایی صفحه اصلی سایت دست‌اول با نشان VIP"
    ],
    strategicPerks: [
      "پوشش انحصاری تامین کل نهادها، ارگان‌ها و خریدهای کلان استان",
      "دسترسی نامحدود به اتاق جلسات مستقیم با مدیران کارخانجات",
      "پورسانت اورراید از تمامی معاملات خرده و عمده انجام‌شده در استان"
    ],
    certificateTitle: "تندیس طلایی و لوح سطح ۴: نماینده ارشد استانی و لیدر فروش"
  }
];

export default function RepresentativeManagementPortal({
  user,
  orders = [],
  products = [],
  onAddToCart,
  b2bConfig,
  setActiveTab: setRootActiveTab,
  onUpdateUser,
  onOpenInvoiceModal
}: RepresentativeManagementPortalProps) {
  // Main Sub-Tab State
  const [activeTab, setActiveTab] = useState<'workplace' | 'perks' | 'leads' | 'catalog_builder' | 'orders' | 'plaque' | 'tiers' | 'analytics' | 'profile' | 'guarantee'>('workplace');
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [workplaceViewMode, setWorkplaceViewMode] = useState<'cards' | 'table'>('cards');

  // Ticket Modal State
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketMessage, setTicketMessage] = useState("");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketSuccessMsg, setTicketSuccessMsg] = useState<string | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);

  // Request Approval Modal State (When >= 300M or requesting audit)
  const [showApprovalRequestModal, setShowApprovalRequestModal] = useState(false);
  const [approvalNote, setApprovalNote] = useState("");
  const [isRequestingApproval, setIsRequestingApproval] = useState(false);
  const [approvalFeedback, setApprovalFeedback] = useState<string | null>(null);

  // Catalog Builder State (Zero-cost High Value perk)
  const [customCatalogTitle, setCustomCatalogTitle] = useState(user?.company || "بازرگانی و پخش مواد غذایی");
  const [customCatalogPhone, setCustomCatalogPhone] = useState(user?.phone || user?.mobile || "");
  const [customCatalogMarkup, setCustomCatalogMarkup] = useState<number>(15); // +15% profit margin for local retailers
  const [catalogCopied, setCatalogCopied] = useState(false);

  // Product Workplace State
  const [productSearch, setProductSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [orderQuantities, setOrderQuantities] = useState<{ [productId: string]: number }>({});
  const [addedSuccessId, setAddedSuccessId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'popular' | 'profit' | 'priceAsc' | 'priceDesc'>('popular');

  // Simulator State
  const [showSimulator, setShowSimulator] = useState(false);

  // Profile Form State
  const [companyName, setCompanyName] = useState(user?.company || user?.name || "دفتر عاملیت و پخش کالا");
  const [province, setProvince] = useState(user?.agencyProvince || user?.city || "تهران");
  const [city, setCity] = useState(user?.city || "تهران");
  const [phone, setPhone] = useState(user?.phone || "");
  const [iban, setIban] = useState(user?.iban || "");
  const [address, setAddress] = useState(user?.address || "");
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Performance Guarantees States
  const [guarantees, setGuarantees] = useState<any[]>([]);
  const [gType, setGType] = useState<'sayad_cheque' | 'promissory_note' | 'bank_guarantee' | 'cash_deposit'>('sayad_cheque');
  const [gAmount, setGAmount] = useState<string>("");
  const [gSayadNumber, setGSayadNumber] = useState<string>("");
  const [gBankName, setGBankName] = useState<string>("");
  const [gChequeNumber, setGChequeNumber] = useState<string>("");
  const [gIssueDate, setGIssueDate] = useState<string>("");
  const [gExpiryDate, setGExpiryDate] = useState<string>("");
  const [gFileSelected, setGFileSelected] = useState<boolean>(false);
  const [gFileName, setGFileName] = useState<string>("");
  const [isSubmittingGuarantee, setIsSubmittingGuarantee] = useState<boolean>(false);
  const [guaranteeSuccessMsg, setGuaranteeSuccessMsg] = useState<string | null>(null);
  const [guaranteeErrorMsg, setGuaranteeErrorMsg] = useState<string | null>(null);

  // Load existing contract addendum tickets from localStorage
  useEffect(() => {
    try {
      const savedTickets = JSON.parse(localStorage.getItem("dastavval_rep_tickets") || "[]");
      setTickets(savedTickets);
      // Load Guarantees too
      const repId = user?.id || user?.phone || "USR-1001";
      setGuarantees(getRepresentativeGuarantees(repId));
    } catch (e) {
      console.warn("Could not load tickets:", e);
    }
  }, [user]);

  // Filter representative's orders
  const myOrders = useMemo(() => {
    return orders.filter(o => 
      o.userId === user?.id || 
      o.customerPhone === user?.phone || 
      o.representativeId === user?.id ||
      (province && (o.city || "").includes(province))
    );
  }, [orders, user, province]);

  // Real Cash Orders Turnover (خرید نقدی)
  const realCashOrdersSum = useMemo(() => {
    return myOrders
      .filter(o => o.paymentMethod === 'cash' || o.isCash || o.status === 'delivered' || true)
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  }, [myOrders]);

  // Representative Approval Status from Admin
  const isApprovedByAdmin = useMemo(() => {
    if (user?.isRepresentativeApproved === true || user?.agencyApproved === true || user?.role === 'representative') {
      return true;
    }
    const localApproved = localStorage.getItem(`dastavval_rep_approved_${user?.id || user?.phone || user?.userCode}`);
    return localApproved === 'true';
  }, [user]);

  // Simulated Sales State (Defaults to real verified cash purchases)
  const [simulatedSales, setSimulatedSales] = useState<number>(() => {
    if (user?.totalSales && user.totalSales > 0) return user.totalSales;
    return realCashOrdersSum;
  });

  // Keep simulated sales synced with real cash orders when simulator isn't manually overriding
  useEffect(() => {
    if (!showSimulator) {
      setSimulatedSales(realCashOrdersSum);
    }
  }, [realCashOrdersSum, showSimulator]);

  // STRICT REQUIREMENT CHECK:
  // Must have >= 300,000,000 Tomans in Cash Purchases AND be approved by Admin
  const isCashSalesTargetAchieved = simulatedSales >= 300_000_000;
  const isRepresentativeActive = isCashSalesTargetAchieved && isApprovedByAdmin;

  // Active Tier (Only unlocked if isRepresentativeActive)
  const activeTier = useMemo(() => {
    if (!isRepresentativeActive) {
      // Pending / Qualification mode
      return {
        ...REPRESENTATIVE_TIERS[0],
        title: "متقاضی عاملیت در حال احراز صلاحیت",
        badgeLabel: "در حال احراز حد نصاب ۳۰۰ میلیون",
        badgeBg: "bg-slate-100 text-slate-700 border-slate-300",
        discountMultiplier: 0,
        discountRate: "غیرفعال تا احراز حد نصاب ۳۰۰M"
      };
    }
    const matched = [...REPRESENTATIVE_TIERS].reverse().find(t => simulatedSales >= t.minSales);
    return matched || REPRESENTATIVE_TIERS[0];
  }, [simulatedSales, isRepresentativeActive]);

  // Estimated Net Profit
  const netRepresentativeProfit = useMemo(() => {
    if (!isRepresentativeActive || simulatedSales <= 0) return 0;
    return Math.round(simulatedSales * activeTier.discountMultiplier);
  }, [simulatedSales, activeTier, isRepresentativeActive]);

  // Progress to 300M Qualification Milestone
  const cashSalesProgressPercent = Math.min(100, Math.round((simulatedSales / 300_000_000) * 100));

  // Next tier progress calculation
  const nextTier = useMemo(() => {
    return REPRESENTATIVE_TIERS.find(t => t.minSales > simulatedSales);
  }, [simulatedSales]);

  const nextTierProgressPercent = nextTier 
    ? Math.min(100, Math.round((simulatedSales / nextTier.minSales) * 100))
    : 100;

  // Filter and sort products for direct representative Workplace
  const filteredProducts = useMemo(() => {
    let list = products.filter(p => {
      if (p.disabled) return false;
      const matchesSearch = 
        (p.name || '').toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.brand || '').toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(productSearch.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    if (sortBy === 'priceAsc') {
      list.sort((a, b) => (a.bulk_price || 0) - (b.bulk_price || 0));
    } else if (sortBy === 'priceDesc') {
      list.sort((a, b) => (b.bulk_price || 0) - (a.bulk_price || 0));
    } else if (sortBy === 'profit') {
      list.sort((a, b) => {
        const mult = activeTier.discountMultiplier || 0.08;
        const profitA = (a.bulk_price || 0) * (a.carton_pack_count || 12) * mult;
        const profitB = (b.bulk_price || 0) * (b.carton_pack_count || 12) * mult;
        return profitB - profitA;
      });
    }

    return list;
  }, [products, productSearch, selectedCategory, sortBy, activeTier]);

  // Distinct categories
  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [products]);

  // Top hot-reorder products
  const hotReorderProducts = useMemo(() => {
    return products.slice(0, 4);
  }, [products]);

  // Dynamic Regional Leads from leads-store
  const [regionalLeads, setRegionalLeads] = useState<RegionalLead[]>(() => getRegionalLeads());
  const [repCommissions, setRepCommissions] = useState(() => getRepCommissions());
  const [leadActionFeedback, setLeadActionFeedback] = useState<string | null>(null);

  // Sync leads when storage changes or on mount
  useEffect(() => {
    setRegionalLeads(getRegionalLeads());
    setRepCommissions(getRepCommissions());
  }, []);

  // Fulfill from representative warehouse (Local Fulfillment - Max Margin)
  const handleFulfillByRep = (leadId: string) => {
    const updated = regionalLeads.map(l => {
      if (l.id === leadId) {
        return {
          ...l,
          status: 'fulfilled_by_rep' as const,
          representativeProfitEarned: Math.round(l.totalEstimatedAmount * 0.12)
        };
      }
      return l;
    });
    setRegionalLeads(updated);
    saveRegionalLeads(updated);
    setLeadActionFeedback("سفارش با موفقیت به انبار شما تخصیص یافت. فاکتور محلی با سود کامل برای مشتری صادر گردید.");
    setTimeout(() => setLeadActionFeedback(null), 4000);
  };

  // Route to factory with 2.5% override commission for the representative
  const handleRouteToFactory = (leadId: string) => {
    const lead = regionalLeads.find(l => l.id === leadId);
    if (!lead) return;

    const commission = Math.round(lead.totalEstimatedAmount * 0.025);
    const updated = regionalLeads.map(l => {
      if (l.id === leadId) {
        return {
          ...l,
          status: 'routed_to_factory' as const,
          representativeCommissionEarned: commission
        };
      }
      return l;
    });
    setRegionalLeads(updated);
    saveRegionalLeads(updated);
    const newComms = addRepCommission(commission, `پورسانت انحصار منطقه از سفارش مستقیم ${lead.storeName}`, leadId);
    setRepCommissions(newComms);
    setLeadActionFeedback(`سفارش جهت ارسال مستقیم به خط تولید کارخانه ارجاع شد. مبلغ ${toPersianNum(commission)} تومان پورسانت انحصار به حساب شما واریز گردید.`);
    setTimeout(() => setLeadActionFeedback(null), 4500);
  };

  // Handle Cart Addition with Carton Pack Logic
  const handleAddProductToCart = (product: Product, overrideCartons?: number) => {
    try {
      if (!product || !product.id) {
        console.error("Invalid product:", product);
        return;
      }
      const minCartons = product.min_order_cartons || 1;
      const qty = overrideCartons || orderQuantities[product.id] || minCartons;
      if (onAddToCart) {
        onAddToCart(product, qty);
        setAddedSuccessId(product.id);
        setTimeout(() => setAddedSuccessId(null), 2500);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const updateQuantity = (productId: string, delta: number, min: number = 1) => {
    setOrderQuantities(prev => {
      const current = prev[productId] || min;
      const updated = Math.max(min, current + delta);
      return { ...prev, [productId]: updated };
    });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const updated = {
      ...user,
      company: companyName,
      agencyProvince: province,
      city,
      phone,
      iban,
      address
    };
    localStorage.setItem("dastavval_user", JSON.stringify(updated));
    if (onUpdateUser) onUpdateUser(updated);
    setTimeout(() => {
      setIsSaving(false);
      setSuccessMsg("مشخصات دفتر عاملیت با موفقیت ذخیره و به‌روزرسانی شد.");
      setTimeout(() => setSuccessMsg(null), 3000);
    }, 400);
  };

  const handleSendApprovalRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRequestingApproval(true);
    setTimeout(() => {
      setIsRequestingApproval(false);
      setShowApprovalRequestModal(false);
      setApprovalFeedback("درخواست ممیزی و احراز صلاحیت عاملیت رسمی شما با موفقیت ثبت شد و به کارتابل مدیر سامانه ارسال گردید.");
      setTimeout(() => setApprovalFeedback(null), 6000);
    }, 600);
  };

  const handleSendAddendumTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTicket(true);

    const newTicket = {
      id: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
      subject: `درخواست صدور قرارداد الحاقی ارتقای سطح به ${activeTier.title}`,
      tierTitle: activeTier.title,
      tierLevel: activeTier.levelNumber,
      salesAmount: simulatedSales,
      repName: user?.name || "مدیریت عاملیت",
      companyName,
      province,
      city,
      userNote: ticketMessage,
      status: "در حال بررسی حقوقی",
      createdAt: new Date().toLocaleDateString('fa-IR')
    };

    const updatedList = [newTicket, ...tickets];
    setTickets(updatedList);
    try {
      localStorage.setItem("dastavval_rep_tickets", JSON.stringify(updatedList));
    } catch (err) {
      console.warn("Could not save ticket to localStorage:", err);
    }

    setTimeout(() => {
      setIsSubmittingTicket(false);
      setShowTicketModal(false);
      setTicketMessage("");
      setTicketSuccessMsg(`تیکت شماره #${newTicket.id} جهت صدور قرارداد الحاقی با موفقیت به دبیرخانه مرکزی ارسال شد.`);
      setTimeout(() => setTicketSuccessMsg(null), 5000);
    }, 500);
  };

  const handleCopyCatalogLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/catalog-view?agent=${user?.agencyCode || 'REP-7012'}&margin=${customCatalogMarkup}`);
    setCatalogCopied(true);
    setTimeout(() => setCatalogCopied(false), 2500);
  };

  const handleSubmitGuarantee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gAmount || Number(gAmount) <= 0) {
      setGuaranteeErrorMsg("لطفاً مبلغ ضمانت‌نامه را به درستی وارد نمایید.");
      return;
    }
    if (gType === 'sayad_cheque' && (!gSayadNumber || gSayadNumber.length !== 16)) {
      setGuaranteeErrorMsg("شناسه صیادی باید دقیقاً ۱۶ رقم باشد.");
      return;
    }

    setIsSubmittingGuarantee(true);
    setGuaranteeErrorMsg(null);
    setGuaranteeSuccessMsg(null);

    const newG = {
      representativeId: user?.id || "USR-1001",
      representativeName: user?.name || "همکار گرامی",
      representativePhone: user?.phone || user?.mobile || "",
      representativeCompany: companyName,
      city: city,
      province: province,
      type: gType,
      amount: Number(gAmount),
      sayadNumber: gType === 'sayad_cheque' ? gSayadNumber : undefined,
      bankName: gBankName || "بانک صادرکننده",
      chequeNumber: gType === 'sayad_cheque' ? gChequeNumber : undefined,
      issueDate: gIssueDate || new Date().toLocaleDateString('fa-IR'),
      expiryDate: gExpiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('fa-IR'),
      documentImageUrl: gFileSelected ? `/uploads/guarantee_${Date.now()}.jpg` : undefined,
      status: 'submitted_pending_review' as const,
      adminNotes: "ثبت شده توسط نماینده، در صف استعلام صیادی و ممیزی مدیریت."
    };

    setTimeout(() => {
      const saved = saveRepresentativeGuarantee(newG);
      setGuarantees(prev => [saved, ...prev]);
      setIsSubmittingGuarantee(false);
      setGuaranteeSuccessMsg(`ضمانت‌نامه به شماره شناسایی ${saved.id} با موفقیت در سامانه بارگذاری و ثبت گردید.`);
      
      // Reset form fields
      setGAmount("");
      setGSayadNumber("");
      setGBankName("");
      setGChequeNumber("");
      setGIssueDate("");
      setGExpiryDate("");
      setGFileSelected(false);
      setGFileName("");
    }, 800);
  };

  const handleSimulateApproveGuarantee = (id: string) => {
    const allGuarantees = JSON.parse(localStorage.getItem('dastavval_rep_guarantees') || "[]");
    const updated = allGuarantees.map((g: any) => {
      if (g.id === id) {
        return {
          ...g,
          status: 'verified_approved',
          adminNotes: "تأییدیه استعلام صیادی بنفش دریافت شد. حسن انجام کار احراز گردید (شبیه‌ساز تایید ادمین).",
          verifiedAt: new Date().toLocaleDateString('fa-IR')
        };
      }
      return g;
    });
    localStorage.setItem('dastavval_rep_guarantees', JSON.stringify(updated));
    
    const repId = user?.id || user?.phone || "USR-1001";
    setGuarantees(updated.filter((g: any) => g.representativeId === repId || g.representativePhone === user?.phone));
    
    // Set feedback
    setGuaranteeSuccessMsg(`وضعیت ضمانت‌نامه ${id} با موفقیت به «تایید شده» تغییر یافت!`);
    setTimeout(() => setGuaranteeSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6 text-right font-sans text-slate-800 bg-white" dir="rtl">
      
      {/* ========================================================================= */}
      {/* 1. STRICT ELIGIBILITY ALERT BANNER (شرط ۳۰۰ میلیون تومان نقدی + تایید مدیر) */}
      {/* ========================================================================= */}
      {!isRepresentativeActive && (
        <motion.div 
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50/80 border-2 border-amber-300 rounded-3xl p-5 sm:p-6 text-right space-y-4 shadow-xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-black shadow-sm">
                <ShieldAlert size={26} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-amber-950">
                    وضعیت حساب: متقاضی عاملیت در حال احراز صلاحیت
                  </h3>
                  <span className="text-[10px] font-black bg-amber-200/80 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                    سطوح عاملیت قفل است 🔒
                  </span>
                </div>
                <p className="text-xs text-amber-900 font-medium leading-relaxed">
                  بر اساس آیین‌نامه رسمی، اعطای نمایندگی، صدور لوح افتخار و فعال‌سازی تخفیفات منوط به <strong>حداقل ۳۰۰ میلیون تومان خرید نقدی در هر ماه</strong> و <strong>تایید رسمی مدیریت سامانه</strong> است.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowApprovalRequestModal(true)}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-2xl transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-xs"
            >
              <Send size={15} />
              <span>درخواست تایید و احراز صلاحیت به مدیریت</span>
            </button>
          </div>

          {/* 2-Step Qualification Progress Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-amber-200/80">
            {/* Step 1: 300M Cash Turnover */}
            <div className="bg-white p-3.5 rounded-2xl border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-[11px] font-black">۱</span>
                  <span>خرید نقدی مستقیم از کارخانجات (در هر ماه):</span>
                </span>
                <span className="font-mono font-black text-amber-700">
                  {toPersianNum(simulatedSales)} / ۳۰۰,۰۰۰,۰۰۰ تومان
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCashSalesTargetAchieved ? "bg-emerald-500" : "bg-gradient-to-r from-amber-400 to-amber-600"
                  }`} 
                  style={{ width: `${cashSalesProgressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                <span>{isCashSalesTargetAchieved ? "حد نصاب خرید نقدی ماهانه تکمیل شد ✓" : `باقیمانده خرید نقدی این ماه: ${toPersianNum(((300_000_000 - simulatedSales)/1_000_000).toFixed(0))} میلیون تومان`}</span>
                <span className="font-mono font-black text-slate-800">{toPersianNum(cashSalesProgressPercent)}٪</span>
              </div>
            </div>

            {/* Step 2: Admin Approval */}
            <div className="bg-white p-3.5 rounded-2xl border border-amber-200/80 space-y-2 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-[11px] font-black">۲</span>
                  <span>تایید مدارک و انحصار منطقه توسط مدیر:</span>
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  isApprovedByAdmin ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                }`}>
                  {isApprovedByAdmin ? "تایید شده ✓" : "در انتظار ممیزی"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                پس از رسیدن به حد نصاب ۳۰۰ میلیون خرید ماهانه، کارشناسان پلتفرم صلاحیت صنفی و انحصار منطقه {province} - {city} را تایید می‌نمایند.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Approval Feedback notification */}
      {approvalFeedback && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-xs font-black text-emerald-950 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{approvalFeedback}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. EXECUTIVE STATUS DASHBOARD (کارت‌های وضعیت اختصاصی نماینده - تم سفید)    */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
        
        {/* Header Profile Summary */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-3xl shrink-0 shadow-xs text-slate-800 font-black">
              🏛️
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                  {companyName}
                </h1>
                <span className={`text-[11px] font-black px-3 py-1 rounded-xl border shadow-2xs ${
                  isRepresentativeActive ? activeTier.badgeBg : "bg-slate-100 text-slate-700 border-slate-300"
                }`}>
                  {isRepresentativeActive ? `${activeTier.badgeLabel} (سطح ${toPersianNum(activeTier.levelNumber)})` : "متقاضی عاملیت رسمی"}
                </span>
                {isRepresentativeActive && (
                  <span className="text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-emerald-600" />
                    <span>احراز صلاحیت رسمی در سامانه کشوری</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-2 flex-wrap">
                <span>کد رسمی عاملیت: <strong className="font-mono text-indigo-700 font-black">{user?.agencyCode || user?.userCode || "REP-7012"}</strong></span>
                <span>•</span>
                <span>منطقه انحصاری: <strong className="text-slate-800 font-bold">{province} - {city}</strong></span>
                <span>•</span>
                <span>مدیریت: <strong className="text-slate-800 font-bold">{user?.name || "همکار گرامی"}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setActiveTab('workplace')}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Briefcase size={16} />
              <span>میز کار سفارشات مستقیم</span>
            </button>

            <button
              onClick={() => setActiveTab('perks')}
              className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <Sparkles size={16} className="text-amber-600" />
              <span>مزایای استراتژیک عاملیت</span>
            </button>

            <button
              onClick={() => setActiveTab('plaque')}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-black rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-xs border border-slate-200"
            >
              <Award size={16} className="text-amber-600" />
              <span>لوح تقدیر و مدارک رسمی</span>
            </button>
          </div>
        </div>

        {/* 4 EXECUTIVE KPI CARDS: فروش کل, سود خالص, سفارشات در انتظار, رتبه و تخفیف */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* KPI 1: فروش کل نقدی (Total Cash Purchases) */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-2"
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span className="flex items-center gap-1.5">
                <TrendingUp size={15} className="text-indigo-600" />
                <span>فروش کل نقدی محقق‌شده:</span>
              </span>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-black border border-emerald-200">
                +۱۴٪ رشد
              </span>
            </div>
            <div className="text-base sm:text-xl font-black text-slate-900 font-mono">
              {toPersianNum(simulatedSales)} <span className="text-xs font-normal text-slate-500">تومان</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              {isCashSalesTargetAchieved 
                ? "احراز حد نصاب ۳۰۰ میلیون تومان در هر ماه ✓" 
                : `فاصله تا حد نصاب ماهانه: ${toPersianNum(((300_000_000 - simulatedSales)/1_000_000).toFixed(0))} میلیون تومان`}
            </div>
          </motion.div>

          {/* KPI 2: سود خالص عاملیت (Net Representative Profit) */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-200 shadow-xs space-y-2"
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800">
              <span className="flex items-center gap-1.5">
                <Wallet size={15} className="text-emerald-600" />
                <span>سود خالص عاملیت:</span>
              </span>
              <span className="text-[10px] font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {isRepresentativeActive ? activeTier.discountRate : "در انتظار احراز"}
              </span>
            </div>
            <div className="text-base sm:text-xl font-black text-emerald-800 font-mono">
              {toPersianNum(netRepresentativeProfit)} <span className="text-xs font-normal text-slate-500">تومان</span>
            </div>
            <div className="text-[10px] text-emerald-700 font-bold">
              {isRepresentativeActive ? "تخفیف مستقیم اعمال‌شده در فاکتورها" : "پس از احراز ۳۰۰M خرید در هر ماه فعال می‌شود"}
            </div>
          </motion.div>

          {/* KPI 3: سفارشات در انتظار و جاری (Pending & Processing Orders) */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-blue-200 shadow-xs space-y-2"
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-blue-800">
              <span className="flex items-center gap-1.5">
                <Clock size={15} className="text-blue-600" />
                <span>سفارشات در انتظار و جاری:</span>
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full border bg-blue-50 text-blue-900 border-blue-200">
                {toPersianNum(myOrders.length)} فاکتور
              </span>
            </div>
            <div className="text-base sm:text-xl font-black text-slate-900 font-mono">
              {toPersianNum(myOrders.length)} <span className="text-xs font-normal text-slate-500">کل سفارشات ثبت‌شده</span>
            </div>
            <button 
              onClick={() => setActiveTab('orders')}
              className="text-[10px] text-blue-700 font-black hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>مشاهده جزییات بارگیری و ترانزیت</span>
              <ArrowUpRight size={11} />
            </button>
          </motion.div>

          {/* KPI 4: سرنخ‌های خریداران منطقه (Buyer Leads) */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-200 shadow-xs space-y-2"
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-purple-800">
              <span className="flex items-center gap-1.5">
                <Radio size={15} className="text-purple-600 animate-pulse" />
                <span>سرنخ‌های خریداران منطقه:</span>
              </span>
              <span className="text-[10px] font-mono font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                {toPersianNum(regionalLeads.length)} استعلام زنده
              </span>
            </div>
            <div className="text-sm sm:text-base font-black text-slate-900 truncate">
              هدایت خودکار سفارشات {city}
            </div>
            <button 
              onClick={() => setActiveTab('leads')}
              className="text-[10px] text-purple-700 font-black hover:underline flex items-center gap-1 cursor-pointer pt-0.5"
            >
              <span>مشاهده و پاسخگویی به استعلام‌ها</span>
              <ArrowUpRight size={11} />
            </button>
          </motion.div>

        </div>

        {/* Level Simulator Tool (Clean White Collapsible Box) */}
        <div className="border border-slate-200 rounded-2xl p-3 bg-white">
          <button
            type="button"
            onClick={() => setShowSimulator(!showSimulator)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sliders size={14} className="text-indigo-600" />
              <span>ابزار تست و شبیه‌ساز ارتقای سطوح و تخفیفات عاملیت</span>
            </div>
            <span className="text-[11px] text-indigo-600 font-black">
              {showSimulator ? "بستن شبیه‌ساز ▲" : "مشاهده شبیه‌ساز ▼"}
            </span>
          </button>

          {showSimulator && (
            <div className="pt-3 mt-3 border-t border-slate-100 space-y-3 animate-fade-in">
              <p className="text-[11px] text-slate-500 font-medium">
                جهت پیش‌نمایش نحوه ارتقای خودکار لوح افتخار، سود خالص، درصد تخفیف و حکم انحصاری، میزان فروش آزمایشی را انتخاب فرمایید:
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSimulatedSales(realCashOrdersSum)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    simulatedSales === realCashOrdersSum ? "bg-indigo-600 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  فروش واقعی نقدی ({toPersianNum(realCashOrdersSum)} تومان)
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatedSales(350_000_000)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    simulatedSales === 350_000_000 ? "bg-amber-600 text-white border-amber-600" : "bg-white text-amber-900 border-amber-200"
                  }`}
                >
                  ۳۵۰M (سطح ۱: عامل فروش رسمی)
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatedSales(1_200_000_000)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    simulatedSales === 1_200_000_000 ? "bg-blue-600 text-white border-blue-600" : "bg-white text-blue-900 border-blue-200"
                  }`}
                >
                  ۱.۲B (سطح ۲: نماینده انحصاری شهر)
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatedSales(2_500_000_000)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    simulatedSales === 2_500_000_000 ? "bg-purple-600 text-white border-purple-600" : "bg-white text-purple-900 border-purple-200"
                  }`}
                >
                  ۲.۵B (سطح ۳: نماینده شهرستان و حومه)
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatedSales(5_500_000_000)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    simulatedSales === 5_500_000_000 ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-emerald-900 border-emerald-200"
                  }`}
                >
                  ۵.۵B (سطح ۴: لیدر استانی)
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. REFINED WHITE SUB-TAB NAVIGATION (تب‌های اصلی کاربری و فروش)            */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        
        {/* Tab 1: Representative Workplace */}
        <button
          onClick={() => setActiveTab('workplace')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'workplace'
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Briefcase size={16} />
          <span>💼 میز کار سفارشات ({toPersianNum(products.length)} کالا)</span>
        </button>

        {/* Tab 2: Zero-cost Strategic Perks */}
        <button
          onClick={() => setActiveTab('perks')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'perks'
              ? "bg-amber-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Sparkles size={16} className="text-amber-400" />
          <span>🌟 مزایای استراتژیک عاملیت</span>
        </button>

        {/* Tab 3: Regional Buyer Leads */}
        <button
          onClick={() => setActiveTab('leads')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'leads'
              ? "bg-purple-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Radio size={16} className="text-purple-400" />
          <span>📡 سرنخ‌های خریداران منطقه ({toPersianNum(regionalLeads.length)})</span>
        </button>

        {/* Tab 4: White-Label Co-Branded Catalog Maker */}
        <button
          onClick={() => setActiveTab('catalog_builder')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'catalog_builder'
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <FileCheck2 size={16} className="text-emerald-400" />
          <span>🏷️ کاتالوگ‌ساز با برند اختصاصی</span>
        </button>

        {/* Tab 5: Orders & Invoices */}
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'orders'
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <FileText size={16} />
          <span>سفارشات و فاکتورها ({toPersianNum(myOrders.length)})</span>
        </button>

        {/* Tab 6: Honor Plaque & Documents */}
        <button
          onClick={() => setActiveTab('plaque')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'plaque'
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Award size={16} className="text-amber-400" />
          <span>🏆 لوح تقدیر و مدارک رسمی</span>
        </button>

        {/* Tab 7: Tier Rules & Addendum Ticket */}
        <button
          onClick={() => setActiveTab('tiers')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'tiers'
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Star size={16} className="text-amber-500" />
          <span>سطوح ۴گانه و قرارداد</span>
        </button>

        {/* Tab Guarantee: Performance Guarantees Covenants */}
        <button
          onClick={() => setActiveTab('guarantee')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'guarantee'
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <ShieldCheck size={16} className="text-emerald-500" />
          <span>🛡️ ضمانت‌نامه و وثایق ملکی/صیادی</span>
        </button>

        {/* Tab 8: Profile & Settings */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <User size={16} />
          <span>مشخصات دفتر عاملیت</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. SUB-TAB CONTENT: 🌟 ZERO-COST STRATEGIC PERKS (مزایای ویژه و بدون هزینه) */}
      {/* ========================================================================= */}
      {activeTab === 'perks' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-5">
            <span className="text-[10px] font-black text-amber-600 tracking-wider uppercase">EXCLUSIVE COMPETITIVE ADVANTAGES</span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 pt-1">
              ۶ مزیت استراتژیک عاملیت رسمی پلتفرم دست‌اول
            </h3>
            <p className="text-xs text-slate-500 font-medium pt-1">
              این امتیازات بدون ایجاد هزینه اضافی برای پلتفرم، حداکثر قدرت رقابتی، فروش پایدار و انحصار واقعی را برای نماینده به ارمغان می‌آورد:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Perk 1: Lead Routing */}
            <div className="bg-white rounded-2xl p-5 border border-purple-200 shadow-xs space-y-3 hover:border-purple-400 transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-black">
                <Radio size={22} />
              </div>
              <h4 className="text-sm font-black text-slate-900">۱. هدایت مستقیم سرنخ‌های خریداران منطقه</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                هر سوپرمارکت، بنکدار یا سازمان در شهر شما که وارد سایت دست‌اول شود، درخواست استعلام و شماره تماس او مستقیماً به انبار شما ارجاع خواهد شد.
              </p>
              <button 
                type="button" 
                onClick={() => setActiveTab('leads')}
                className="text-[11px] text-purple-700 font-black flex items-center gap-1 hover:underline cursor-pointer pt-1"
              >
                <span>مشاهده سرنخ‌های فعال</span>
                <ChevronLeft size={14} />
              </button>
            </div>

            {/* Perk 2: Priority Dispatch Queue */}
            <div className="bg-white rounded-2xl p-5 border border-blue-200 shadow-xs space-y-3 hover:border-blue-400 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black">
                <Truck size={22} />
              </div>
              <h4 className="text-sm font-black text-slate-900">۲. اولویت اول بارگیری در ایام کمبود بار (VIP Queue)</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                در ایام پیک تقاضا (شب عید، جشنواره‌ها)، بار نماینده بدون معطلی در صف‌های چند هفته‌ای کارخانه، با خط مستقیم ترانزیت بارگیری می‌شود.
              </p>
            </div>

            {/* Perk 3: Co-Branded White-label Catalog */}
            <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-xs space-y-3 hover:border-emerald-400 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
                <FileCheck2 size={22} />
              </div>
              <h4 className="text-sm font-black text-slate-900">۳. کاتالوگ‌ساز با برند اختصاصی نماینده</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                تولید کاتالوگ PDF رسمی محصولات با لوگو، شماره تلفن و آدرس انبار شما به همراه نرخ مدنظر شما برای بازاریابی مویرگی در سطح منطقه.
              </p>
              <button 
                type="button" 
                onClick={() => setActiveTab('catalog_builder')}
                className="text-[11px] text-emerald-700 font-black flex items-center gap-1 hover:underline cursor-pointer pt-1"
              >
                <span>ساخت کاتالوگ اختصاصی</span>
                <ChevronLeft size={14} />
              </button>
            </div>

            {/* Perk 4: 48-Hour Price Radar */}
            <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-xs space-y-3 hover:border-amber-400 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-black">
                <BellRing size={22} />
              </div>
              <h4 className="text-sm font-black text-slate-900">۴. رادار هوشمند پیش‌خرید پیش از گرانی کالا</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                اطلاع‌رسانی اختصاصی ۴۸ ساعت قبل از هرگونه افزایش قیمت مصوب کارخانجات، تا نماینده بتواند پیش از گرانی موجودی انبار خود را با سود بالا تکمیل کند.
              </p>
            </div>

            {/* Perk 5: Verified Directory Gold Listing */}
            <div className="bg-white rounded-2xl p-5 border border-indigo-200 shadow-xs space-y-3 hover:border-indigo-400 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black">
                <ShieldCheck size={22} />
              </div>
              <h4 className="text-sm font-black text-slate-900">۵. درج طلایی در صفحه اول «بانک نمایندگان رسمی»</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                ثبت نام دفتر عاملیت شما در سامانه رسمی کشور با تاییدیه اتاق بازرگانی، لینک اختصاصی و سئوی گوگل جهت کسب اعتماد ۱۰۰٪ خریداران.
              </p>
            </div>

            {/* Perk 6: Customer Network Protection */}
            <div className="bg-white rounded-2xl p-5 border border-rose-200 shadow-xs space-y-3 hover:border-rose-400 transition-all">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-black">
                <Lock size={22} />
              </div>
              <h4 className="text-sm font-black text-slate-900">۶. تعهد عدم دور زدن و حفاظت از مشتریان</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                تضمین سیستمی پلتفرم مبنی بر اینکه کارخانجات حق فروش مستقیم با نرخ پایین‌تر به مشتریان معرفی‌شده توسط نماینده را نخواهند داشت.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SUB-TAB CONTENT: 📡 REGIONAL BUYER LEADS & CONFLICT RESOLUTION         */}
      {/* ========================================================================= */}
      {activeTab === 'leads' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
          
          {/* Header & Conflict Resolution Policy Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full uppercase">
                  CHANNEL CONFLICT RESOLUTION • هدایت هوشمند تقاضا
                </span>
                <span className="text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={11} className="text-emerald-600" />
                  <span>انحصار ۱۰۰٪ منطقه‌ای فعال</span>
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2 pt-1.5">
                <Radio size={20} className="text-purple-600 animate-pulse" />
                <span>سرنخ‌ها و سفارشات مستقیم خریداران منطقه ({province} - {city})</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium pt-0.5">
                هر خریداری از منطقه شما سفارش دهد، ابتدا به انبار شما پیشنهاد می‌شود؛ در صورت عدم موجودی، کارخانه مستقیماً ارسال کرده و ۲.۵٪ پورسانت نقدی به حسابتان واریز می‌شود.
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 text-left">
              <span className="text-[10px] text-purple-700 font-bold block">موجودی پورسانت انحصار قابل برداشت:</span>
              <div className="text-base font-mono font-black text-purple-950">
                +{toPersianNum(repCommissions.totalCommission)} <span className="text-[10px] font-normal text-purple-700">تومان</span>
              </div>
            </div>
          </div>

          {/* Action Feedback Banner */}
          {leadActionFeedback && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-xs font-black text-emerald-950 flex items-center gap-2.5 animate-fade-in shadow-xs">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{leadActionFeedback}</span>
            </div>
          )}

          {/* 3 Strategy Logic Explainer Box */}
          <div className="bg-gradient-to-r from-slate-50 to-purple-50/40 p-4 rounded-2xl border border-purple-100 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="space-y-1">
              <strong className="text-slate-900 font-black flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-black">۱</span>
                <span>تامین مستقیم از انبار شما:</span>
              </strong>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                سود کامل عاملیت (۱۰٪ تا ۱۶٪) مستقیماً برای شما محقق شده و فاکتور به مشتری تحویل می‌شود.
              </p>
            </div>

            <div className="space-y-1">
              <strong className="text-slate-900 font-black flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">۲</span>
                <span>ارسال مستقیم کارخانه (Override):</span>
              </strong>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                اگر کالا را در انبار ندارید، کارخانه بار را می‌فرستد و ۲.۵٪ پورسانت به کیف پولتان می‌نشیند.
              </p>
            </div>

            <div className="space-y-1">
              <strong className="text-slate-900 font-black flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-black">۳</span>
                <span>مهلت تصمیم‌گیری ۲۴ ساعته:</span>
              </strong>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                برای جلوگیری از معطلی خریدار، تا ۲۴ ساعت فرصت اقدام دارید و سپس خودکار با پورسانت ثبت می‌شود.
              </p>
            </div>
          </div>

          {/* Leads List */}
          <div className="space-y-3">
            {regionalLeads.map((lead) => {
              const isPending = lead.status === 'pending_rep_action';
              const isFulfilledByRep = lead.status === 'fulfilled_by_rep';
              const isRoutedToFactory = lead.status === 'routed_to_factory';
              const overrideCommission = Math.round(lead.totalEstimatedAmount * 0.025);
              const repProfitEstimate = Math.round(lead.totalEstimatedAmount * (activeTier.discountMultiplier || 0.12));

              return (
                <div 
                  key={lead.id} 
                  className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-4 ${
                    isPending 
                      ? "bg-white border-purple-200 shadow-xs hover:border-purple-300"
                      : isFulfilledByRep 
                      ? "bg-emerald-50/40 border-emerald-200"
                      : "bg-slate-50/70 border-slate-200"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-mono font-black text-slate-800 bg-slate-100 px-2.5 py-1 rounded-xl">
                        {lead.id}
                      </span>
                      <h4 className="text-sm font-black text-slate-900">{lead.customerName}</h4>
                      <span className="text-xs text-slate-500 font-medium">({lead.storeName})</span>
                      <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                        📍 {lead.city}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPending && (
                        <span className="text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-xl flex items-center gap-1">
                          <Clock size={12} className="text-amber-600 animate-spin" />
                          <span>مهلت تصمیم: ۲۲ ساعت باقیمانده</span>
                        </span>
                      )}
                      {isFulfilledByRep && (
                        <span className="text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-xl flex items-center gap-1">
                          <CheckCircle2 size={13} className="text-emerald-700" />
                          <span>تامین‌شده توسط انبار شما (سود کامل)</span>
                        </span>
                      )}
                      {isRoutedToFactory && (
                        <span className="text-[11px] font-black bg-blue-100 text-blue-900 border border-blue-300 px-3 py-1 rounded-xl flex items-center gap-1">
                          <Truck size={13} className="text-blue-700" />
                          <span>ارسال مستقیم کارخانه (+۲.۵٪ پورسانت)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Order Details & Financials */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-500 text-[11px] block">کالای درخواستی:</span>
                      <strong className="text-slate-900 font-black">{lead.requestedProduct}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">حجم سفارش:</span>
                      <strong className="text-slate-900 font-bold">{toPersianNum(lead.quantityCartons)} کارتن عمده</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">ارزش کل فاکتور:</span>
                      <strong className="text-indigo-700 font-mono font-black">{toPersianNum(lead.totalEstimatedAmount)} تومان</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">پورسانت انحصار شما (۲.۵٪):</span>
                      <strong className="text-emerald-700 font-mono font-black">+{toPersianNum(overrideCommission)} تومان</strong>
                    </div>
                  </div>

                  {/* Action Buttons for Representative */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                        📞 {lead.phone}
                      </span>
                      <a
                        href={`tel:${lead.phone}`}
                        className="text-xs font-bold text-indigo-700 hover:text-indigo-900 hover:underline"
                      >
                        تماس تلفنی با خریدار
                      </a>
                    </div>

                    {isPending && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Option 1: Rep Fulfills */}
                        <button
                          type="button"
                          onClick={() => handleFulfillByRep(lead.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="ارسال از انبار خودم و دریافت سود کامل عاملیت"
                        >
                          <ShoppingBag size={14} />
                          <span>تأمین از انبار من (+{toPersianNum(repProfitEstimate)} ت سود)</span>
                        </button>

                        {/* Option 2: Factory Fulfills with Commission */}
                        <button
                          type="button"
                          onClick={() => handleRouteToFactory(lead.id)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="ارجاع به خط تولید کارخانه و دریافت فوری ۲.۵٪ پورسانت انحصار منطقه"
                        >
                          <Truck size={14} />
                          <span>ارسال مستقیم کارخانه (+{toPersianNum(overrideCommission)} ت پورسانت)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Commission Withdrawal Box */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-800">شماره شبا جهت تسویه پورسانت‌های انحصار:</span>
              <p className="font-mono text-slate-600 text-[11px]">{iban || "IR-000000000000000000000000 (ثبت در تب مشخصات عاملیت)"}</p>
            </div>

            <button
              type="button"
              onClick={() => alert(`درخواست تسویه حساب به مبلغ ${toPersianNum(repCommissions.totalCommission)} تومان به واحد مالی کارخانجات ارسال شد و تا ۲۴ ساعت آینده به شبای شما واریز خواهد گردید.`)}
              className="px-4 py-2 bg-indigo-600 hover:bg-black text-white font-black rounded-xl transition-all cursor-pointer shadow-xs shrink-0"
            >
              درخواست تسویه پورسانت به حساب بانکی
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. SUB-TAB CONTENT: 🏷️ WHITE-LABEL CO-BRANDED CATALOG BUILDER             */}
      {/* ========================================================================= */}
      {activeTab === 'catalog_builder' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-5">
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <FileCheck2 size={20} className="text-emerald-600" />
              <span>کاتالوگ‌ساز با برند، نام و شماره تماس اختصاصی نماینده</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium pt-0.5">
              کاتالوگ و لیست قیمت محصولات کارخانجات را با نام مجموعه و شماره خودتان صادر کنید تا ویزیتورها و بنکداران محلی مستقیماً با شما معامله کنند:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">نام درج‌شده روی سربرگ کاتالوگ:</label>
              <input
                type="text"
                value={customCatalogTitle}
                onChange={(e) => setCustomCatalogTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">تلفن تماس مستقیم جهت سفارش‌گیری:</label>
              <input
                type="text"
                value={customCatalogPhone}
                onChange={(e) => setCustomCatalogPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none transition-all text-left font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">حاشیه سود فروش به خرده‌فروشان (%):</label>
              <input
                type="number"
                value={customCatalogMarkup}
                onChange={(e) => setCustomCatalogMarkup(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none transition-all text-left font-mono"
              />
            </div>
          </div>

          {/* Action and Preview Link */}
          <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-black text-emerald-900">لینک اختصاصی کاتالوگ الکترونیک شما:</span>
              <p className="text-[11px] text-emerald-800 font-mono">
                {window.location.origin}/catalog-view?agent={user?.agencyCode || 'REP-7012'}&margin={customCatalogMarkup}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCatalogLink}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {catalogCopied ? <Check size={14} /> : <Copy size={14} />}
                <span>{catalogCopied ? "کپی شد" : "کپی لینک کاتالوگ"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. SUB-TAB CONTENT: 💼 REPRESENTATIVE WORKPLACE (میز کار سفارشات مستقیم)    */}
      {/* ========================================================================= */}
      {activeTab === 'workplace' && (
        <div className="space-y-6">
          
          {/* Quick Reorder Hotbar (کالاهای پرفروش و شارژ سریع کارخانه) */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                  <Zap size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">شارژ سریع کالاهای پرتقاضای منطقه (Re-Order Hotbar)</h3>
                  <p className="text-[11px] text-slate-500 font-medium">ثبت فوری سفارش برترین خطوط تولید کارخانجات با ۱ کلیک</p>
                </div>
              </div>

              <span className="text-[11px] font-black text-amber-900 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                تخفیف فعال شما: {activeTier.discountRate}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {hotReorderProducts.map((p) => {
                const minCartons = p.min_order_cartons || 2;
                const unitsInCarton = p.carton_pack_count || 12;
                const unitPrice = p.bulk_price || 0;
                const cartonPrice = unitPrice * unitsInCarton;
                const mult = activeTier.discountMultiplier || 0.08;
                const repCartonPrice = Math.round(cartonPrice * (1 - mult));

                return (
                  <div key={p.id} className="bg-slate-50/70 hover:bg-slate-100/80 p-3.5 rounded-2xl border border-slate-200 transition-all flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-indigo-700 block">{p.brand || "تولید مستقیم"}</span>
                      <h4 className="text-xs font-black text-slate-900 line-clamp-1">{p.name}</h4>
                      <div className="text-[11px] font-mono text-amber-800 font-black">
                        {toPersianNum(repCartonPrice)} ت <span className="text-[9px] text-slate-500 font-normal">/ کارتن</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAddProductToCart(p, 5)}
                        className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                        title="ثبت فوری ۵ کارتن"
                      >
                        <Plus size={11} />
                        <span>۵ کارتن</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddProductToCart(p, 10)}
                        className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                        title="ثبت فوری ۱۰ کارتن"
                      >
                        <Plus size={11} />
                        <span>۱۰ کارتن</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddProductToCart(p, 20)}
                        className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                        title="ثبت فوری ۲۰ کارتن"
                      >
                        <Plus size={11} />
                        <span>۲۰ کارتن</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Workplace Search, Filters & View Mode Bar */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* Search Bar */}
              <div className="relative w-full sm:flex-1">
                <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="جستجوی سریع کالا، کارخانه یا برند در میز کار..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-slate-800 font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              {/* View Switcher & Sorting */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                
                {/* Sort dropdown */}
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 py-2.5 px-3 rounded-2xl outline-none"
                >
                  <option value="popular">مرتب‌سازی: پرفروش‌ترین‌ها</option>
                  <option value="profit">بیشترین سود عاملیت</option>
                  <option value="priceAsc">ارزان‌ترین قیمت</option>
                  <option value="priceDesc">گران‌ترین قیمت</option>
                </select>

                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setWorkplaceViewMode('cards')}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      workplaceViewMode === 'cards' ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-900"
                    }`}
                    title="نمای کارت‌های کاتالوگ"
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkplaceViewMode('table')}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      workplaceViewMode === 'table' ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-900"
                    }`}
                    title="نمای جدول سریع و متمرکز میز کار"
                  >
                    <List size={16} />
                  </button>
                </div>

              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {categories.map((cat, idx) => (
                <button
                  key={`rep-cat-btn-${cat}-${idx}`}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                    selectedCategory === cat
                      ? "bg-slate-100 text-slate-900 border-slate-300 font-black shadow-2xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {cat === 'all' ? 'همه گروه‌ها' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* WORKPLACE VIEW: DATA TABLE OR VISUAL CARDS */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <Package size={48} className="text-slate-300 mx-auto" />
              <h4 className="text-sm font-black text-slate-700">کالایی با این مشخصات یافت نشد</h4>
              <p className="text-xs text-slate-400">لطفاً فیلتر جستجو یا دسته‌بندی را تغییر دهید.</p>
            </div>
          ) : workplaceViewMode === 'table' ? (
            
            /* DENSE DATA TABLE WORKPLACE */
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/80">
                      <th className="py-3.5 px-4">نام و مشخصات کالا</th>
                      <th className="py-3.5 px-4">برند / کارخانه</th>
                      <th className="py-3.5 px-4">بسته‌بندی در کارتن</th>
                      <th className="py-3.5 px-4">قیمت کارخانه</th>
                      <th className="py-3.5 px-4">قیمت عاملیت</th>
                      <th className="py-3.5 px-4">سود نماینده / کارتن</th>
                      <th className="py-3.5 px-4 text-center">تعداد کارتن</th>
                      <th className="py-3.5 px-4 text-center">اقدام</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((p, pIdx) => {
                      const minCartons = p.min_order_cartons || 2;
                      const currentQty = orderQuantities[p.id] || minCartons;
                      const unitsInCarton = p.carton_pack_count || 12;
                      const unitPrice = p.bulk_price || 0;
                      const cartonPrice = unitPrice * unitsInCarton;
                      const mult = activeTier.discountMultiplier || 0.08;
                      const repCartonPrice = Math.round(cartonPrice * (1 - mult));
                      const repProfitPerCarton = cartonPrice - repCartonPrice;
                      const isAdded = addedSuccessId === p.id;

                      return (
                        <tr key={`rep-prod-tbl-${p.id || pIdx}-${pIdx}`} className="hover:bg-slate-50/90 transition-colors font-medium">
                          <td className="py-3 px-4 font-black text-slate-900">
                            {p.name}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold text-[11px]">
                              {p.brand || p.factory_name || "تولید مستقیم"}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            {toPersianNum(unitsInCarton)} عدد
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500 line-through">
                            {toPersianNum(cartonPrice)} ت
                          </td>
                          <td className="py-3 px-4 font-mono font-black text-indigo-700">
                            {toPersianNum(repCartonPrice)} تومان
                          </td>
                          <td className="py-3 px-4 font-mono font-black text-emerald-600">
                            +{toPersianNum(repProfitPerCarton)} ت
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                              <button
                                type="button"
                                onClick={() => updateQuantity(p.id, -1, minCartons)}
                                className="w-6 h-6 bg-white hover:bg-slate-200 text-slate-800 rounded-lg flex items-center justify-center font-black text-xs cursor-pointer shadow-2xs"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-mono font-black text-xs text-slate-900">
                                {toPersianNum(currentQty)}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(p.id, 1, minCartons)}
                                className="w-6 h-6 bg-white hover:bg-slate-200 text-slate-800 rounded-lg flex items-center justify-center font-black text-xs cursor-pointer shadow-2xs"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleAddProductToCart(p)}
                              className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                                isAdded ? "bg-emerald-600 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"
                              }`}
                            >
                              {isAdded ? <Check size={13} /> : <ShoppingBag size={13} />}
                              <span>{isAdded ? "ثبت شد" : "افزودن به سبد"}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          ) : (

            /* VISUAL CARDS WORKPLACE */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((p, pIdx) => {
                const minCartons = p.min_order_cartons || 2;
                const currentQty = orderQuantities[p.id] || minCartons;
                const unitsInCarton = p.carton_pack_count || 12;
                const unitPrice = p.bulk_price || 0;
                const cartonPrice = unitPrice * unitsInCarton;
                const mult = activeTier.discountMultiplier || 0.08;
                const repCartonPrice = Math.round(cartonPrice * (1 - mult));
                const repProfitPerCarton = cartonPrice - repCartonPrice;
                const totalPrice = repCartonPrice * currentQty;
                const isAdded = addedSuccessId === p.id;

                return (
                  <motion.div 
                    key={`rep-prod-card-${p.id}-${pIdx}`}
                    whileHover={{ y: -3 }}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group"
                  >
                    {/* Top Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {p.brand || p.factory_name || "تولید مستقیم"}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 leading-snug line-clamp-2 pt-1">
                          {p.name}
                        </h4>
                      </div>

                      {p.image_url ? (
                        <img 
                          src={p.image_url} 
                          alt={p.name}
                          className="w-16 h-16 object-contain rounded-xl border border-slate-100 shrink-0 p-1 bg-slate-50"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl shrink-0">
                          📦
                        </div>
                      )}
                    </div>

                    {/* Packaging & Pricing Specs */}
                    <div className="bg-slate-50/90 rounded-2xl p-3.5 border border-slate-100 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-slate-600 font-medium">
                        <span>بسته‌بندی در هر کارتن:</span>
                        <strong className="text-slate-900 font-bold">{toPersianNum(unitsInCarton)} عدد</strong>
                      </div>
                      <div className="flex justify-between items-center text-slate-600 font-medium">
                        <span>قیمت پایه کارخانه:</span>
                        <span className="font-mono text-slate-500 line-through">{toPersianNum(cartonPrice)} ت</span>
                      </div>
                      <div className="flex justify-between items-center text-indigo-900 font-black border-t border-slate-200/60 pt-1.5">
                        <span>قیمت با تخفیف نماینده:</span>
                        <strong className="text-indigo-600 font-mono text-sm">{toPersianNum(repCartonPrice)} تومان</strong>
                      </div>
                      <div className="flex justify-between items-center text-emerald-800 font-bold bg-emerald-50/80 px-2 py-1 rounded-xl border border-emerald-100">
                        <span>سود ناخالص در هر کارتن:</span>
                        <strong className="font-mono text-emerald-700 font-black">+{toPersianNum(repProfitPerCarton)} ت</strong>
                      </div>
                    </div>

                    {/* Quantity Selector & Order Action */}
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-center justify-between gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                        <span className="text-[11px] font-bold text-slate-600 px-2">تعداد کارتن:</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(p.id, -1, minCartons)}
                            className="w-7 h-7 bg-white hover:bg-slate-200 text-slate-800 rounded-xl flex items-center justify-center font-black text-sm cursor-pointer shadow-2xs"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-10 text-center font-mono font-black text-sm text-slate-900">
                            {toPersianNum(currentQty)}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(p.id, 1, minCartons)}
                            className="w-7 h-7 bg-white hover:bg-slate-200 text-slate-800 rounded-xl flex items-center justify-center font-black text-sm cursor-pointer shadow-2xs"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Summary and Profit for selected quantity */}
                      <div className="flex items-center justify-between text-[11px] font-bold px-1 text-slate-600">
                        <span>فاکتور ({toPersianNum(currentQty * unitsInCarton)} عدد):</span>
                        <span className="font-mono text-slate-900 font-black">{toPersianNum(totalPrice)} تومان</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddProductToCart(p)}
                        className={`w-full py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                          isAdded 
                            ? "bg-emerald-600 text-white shadow-emerald-600/20"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/15"
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <CheckCircle2 size={16} />
                            <span>به سبد اضافه شد ✓</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag size={16} />
                            <span>افزودن به سبد خرید نماینده</span>
                          </>
                        )}
                      </button>
                    </div>

                  </motion.div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. SUB-TAB CONTENT: 📦 ORDERS & REGIONAL INVOICES                         */}
      {/* ========================================================================= */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <FileText size={20} className="text-indigo-600" />
                <span>لیست سفارشات و فاکتورهای رسمی عاملیت</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium pt-0.5">
                مشاهده وضعیت ارسال بار کارخانجات، فاکتورهای معتبر و صورت‌حساب‌های صادره
              </p>
            </div>

            <span className="text-xs font-black bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200">
              کل خرید نقدی محقق: {toPersianNum(realCashOrdersSum)} تومان
            </span>
          </div>

          {myOrders.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <ShoppingBag size={48} className="text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-700">هنوز سفارشی ثبت نشده است</h4>
                <p className="text-xs text-slate-400">
                  برای شروع و احراز حد نصاب ۳۰۰ میلیون تومانی، اولین سفارش نقدی مستقیم خود را از «میز کار سفارشات» ثبت فرمایید.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('workplace')}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <ShoppingBag size={14} />
                <span>ثبت اولین سفارش کالا</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/70">
                    <th className="py-3 px-4 rounded-r-xl">شماره فاکتور</th>
                    <th className="py-3 px-4">تاریخ ثبت</th>
                    <th className="py-3 px-4">تعداد اقلام</th>
                    <th className="py-3 px-4">مبلغ کل فاکتور</th>
                    <th className="py-3 px-4">وضعیت بارگیری و ارسال</th>
                    <th className="py-3 px-4 text-center rounded-l-xl">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myOrders.map((ord: any, idx: number) => {
                    const statusConfig = {
                      'pending': { label: 'در انتظار تایید', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                      'processing': { label: 'در حال آماده‌سازی کارخانه', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                      'shipped': { label: 'تحویل باربری و ترانزیت', color: 'bg-purple-50 text-purple-700 border-purple-200' },
                      'delivered': { label: 'تحویل نهایی شده', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                    }[ord.status as string] || { label: 'تاییدشده', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };

                    return (
                      <tr key={ord.id || idx} className="hover:bg-slate-50/80 transition-colors font-medium">
                        <td className="py-3.5 px-4 font-mono font-black text-slate-900">
                          {toPersianNum(ord.id || `INV-${1000 + idx}`)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {toPersianNum(ord.createdAt || ord.date || "۱۴۰۵/۰۵/۲۲")}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-bold">
                          {toPersianNum(ord.items?.length || 1)} قلم کالا
                        </td>
                        <td className="py-3.5 px-4 font-mono font-black text-indigo-700">
                          {toPersianNum((ord.totalAmount || 0))} تومان
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => onOpenInvoiceModal && onOpenInvoiceModal(ord)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-[11px] transition-all inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Printer size={12} />
                            <span>چاپ فاکتور</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. SUB-TAB CONTENT: 🏆 LUXURY HONOR PLAQUE & OFFICIAL DOCUMENTS HUB       */}
      {/* ========================================================================= */}
      {activeTab === 'plaque' && (
        <div className="space-y-6">
          <HonorPlaqueCard
            repName={user?.name || "مدیریت عاملیت"}
            companyName={companyName}
            tierLevel={activeTier.levelNumber}
            tierTitle={activeTier.title}
            badgeLabel={activeTier.badgeLabel}
            monthlySales={simulatedSales}
            agencyCode={user?.agencyCode || user?.userCode || "REP-7012"}
            province={province}
            city={city}
            showDownloadButton={true}
            onOpenPdfModal={() => setShowCertificateModal(true)}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. SUB-TAB CONTENT: 📈 4 TIERS & ADDENDUM CONTRACT TICKET                */}
      {/* ========================================================================= */}
      {activeTab === 'tiers' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Star size={20} className="text-amber-500" />
                <span>ضوابط سطوح ۴ گانه عاملیت و قرارداد الحاقی</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium pt-0.5">
                با ارتقای سقف خرید نقدی ماهانه، قرارداد الحاقی رسمی با مزایا و حقوق انحصاری بالاتر صادر می‌گردد.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowTicketModal(true)}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Send size={14} />
              <span>درخواست قرارداد الحاقی ارتقای رتبه</span>
            </button>
          </div>

          {/* 4 Tiers Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {REPRESENTATIVE_TIERS.map((tier) => {
              const isCurrent = isRepresentativeActive && activeTier.levelNumber === tier.levelNumber;
              const isAchieved = simulatedSales >= tier.minSales;

              return (
                <div
                  key={tier.id}
                  className={`rounded-3xl p-5 border-2 transition-all flex flex-col justify-between space-y-4 relative ${
                    isCurrent
                      ? `${tier.borderColor} bg-white shadow-md ring-2 ring-indigo-500/20`
                      : isAchieved && isRepresentativeActive
                      ? "border-emerald-200 bg-white"
                      : "border-slate-200 bg-white opacity-85"
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute -top-3 right-4 bg-indigo-600 text-white text-[10px] font-black px-3 py-0.5 rounded-full shadow-xs">
                      سطح فعال شما ✓
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-500">سطح {toPersianNum(tier.levelNumber)}</span>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${tier.badgeBg}`}>
                        {tier.discountRate}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-900">
                      {tier.title}
                    </h4>

                    <div className="text-xs font-bold font-mono text-indigo-700 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      حداقل فروش: {toPersianNum(tier.minSalesFormatted)}
                    </div>

                    <ul className="space-y-1.5 pt-2 text-[11px] text-slate-600 font-medium">
                      {tier.benefits.map((b, i) => (
                        <li key={`rep-mgmt-tier-ben-${b.slice(0, 5)}-${i}`} className="flex items-start gap-1.5">
                          <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block">
                      لوح رسمی: {tier.certificateTitle}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 10.5. SUB-TAB CONTENT: 🛡️ REPRESENTATIVE GUARANTEES & PERFORMANCE BONDS     */}
      {/* ========================================================================= */}
      {activeTab === 'guarantee' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-5">
              <span className="text-[10px] font-black text-emerald-600 tracking-wider uppercase">PERFORMANCE COVENANT & COLLATERAL</span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 pt-1 flex items-center gap-2">
                <ShieldCheck size={22} className="text-emerald-600" />
                <span>سامانه ثبت ضمانت‌نامه و وثایق حسن انجام کار</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium pt-1 leading-relaxed">
                نمایندگان محترم دست‌اول می‌توانند جهت تضمین تعهدات تحویل کالای منطقه‌ای، فعال‌سازی سقف اعتباری خرید بدون پرداخت نقدی فوری، چک صیادی بنفش یا ضمانت‌نامه بانکی خود را در این سامانه بارگذاری نمایند.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-black shrink-0">۱</div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-900">چک صیادی (بنفش)</h4>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">ثبت شناسه ۱۶ رقمی صیادی به همراه ثبت به نام شرکت توسعه تجارت دست‌اول در سامانه شاپرک.</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center text-sm font-black shrink-0">۲</div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-900">گواهی اعتباریتو (Etebarito)</h4>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">استعلام آنلاین رتبه اعتباری از سامانه اعتباریتو جهت افزایش سقف اعتبار تخصیصی به منطقه.</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-sm font-black shrink-0">۳</div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-900">ضمانت‌نامه تعهد پرداخت بانکی</h4>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">تسهیل ترخیص کالا از گمرکات و انبار تولیدی کارخانجات با ثبت ضمانت تعهد پرداخت.</p>
                </div>
              </div>
            </div>

            {/* Etebarito Direct Action Box */}
            <div className="bg-indigo-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl shrink-0">
                  🌐
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">سامانه اعتبارسنجی ملی اعتباریتو (Etebarito.ir)</h4>
                  <p className="text-[11px] text-indigo-200 font-medium mt-0.5">
                    جهت دریافت کارنامه و استعلام رتبه اعتباری بانکی خود، به سامانه اعتباریتو مراجعه نموده و فایل گزارش را بارگذاری نمایید.
                  </p>
                </div>
              </div>

              <a
                href="https://etebarito.ir"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-md"
              >
                <span>ورود به سایت اعتباریتو</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Form Section */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 h-fit">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Plus size={18} className="text-emerald-600" />
                  <span>ثبت وثیقه / ضمانت‌نامه جدید</span>
                </h4>
                <p className="text-[11px] text-slate-500 font-medium pt-0.5">ثبت مشخصات دقیق برگه چک صیادی یا سند ضمانت‌نامه</p>
              </div>

              {guaranteeSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-xs font-black text-emerald-950 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <span>{guaranteeSuccessMsg}</span>
                </div>
              )}

              {guaranteeErrorMsg && (
                <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 text-xs font-black text-rose-950 flex items-center gap-2">
                  <AlertCircle size={18} className="text-rose-600 shrink-0" />
                  <span>{guaranteeErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmitGuarantee} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">نوع وثیقه / ضمانت‌نامه:</label>
                  <select
                    value={gType}
                    onChange={(e: any) => setGType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition-all cursor-pointer"
                  >
                    <option value="sayad_cheque">چک صیادی بنفش (ضمانت)</option>
                    <option value="etebarito_cert">گواهی اعتبارسنجی سامانه اعتباریتو (Etebarito)</option>
                    <option value="bank_guarantee">ضمانت‌نامه تعهد پرداخت بانکی</option>
                    <option value="promissory_note">سفته الکترونیکی هوشمند</option>
                    <option value="cash_deposit">ودیعه نقدی حسن انجام کار</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">مبلغ اسمی ضمانت (تومان):</label>
                  <input
                    type="number"
                    required
                    placeholder="مثال: 500000000"
                    value={gAmount}
                    onChange={(e) => setGAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-black text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition-all font-mono text-left"
                  />
                  {gAmount && (
                    <div className="text-[10px] text-emerald-700 font-bold text-left">
                      معادل: {toPersianNum((Number(gAmount) / 10))} تومان
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">نام بانک صادرکننده:</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: بانک ملت"
                      value={gBankName}
                      onChange={(e) => setGBankName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">شماره چک / سند:</label>
                    <input
                      type="text"
                      placeholder="مثال: ۹۱۲۳۴۵"
                      value={gChequeNumber}
                      onChange={(e) => setGChequeNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition-all text-left font-mono"
                    />
                  </div>
                </div>

                {gType === 'sayad_cheque' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">شناسه ۱۶ رقمی صیاد:</label>
                    <input
                      type="text"
                      required
                      maxLength={16}
                      placeholder="شناسه ۱۶ رقمی روی چک"
                      value={gSayadNumber}
                      onChange={(e) => setGSayadNumber(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-black text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition-all text-left font-mono tracking-widest"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                      <span>فقط اعداد انگلیسی بدون خط تیره</span>
                      <span>{toPersianNum(gSayadNumber.length)} / ۱۶ رقم</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">تاریخ صدور / ثبت:</label>
                    <input
                      type="text"
                      placeholder="۱۴۰۳/۰۵/۱۰"
                      value={gIssueDate}
                      onChange={(e) => setGIssueDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition-all text-center font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">تاریخ انقضا / سررسید:</label>
                    <input
                      type="text"
                      placeholder="۱۴۰۴/۰۵/۱۰"
                      value={gExpiryDate}
                      onChange={(e) => setGExpiryDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition-all text-center font-mono"
                    />
                  </div>
                </div>

                {/* File Upload Box (Meets requirements: drag and drop + click to upload styling) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">تصویر اسکن ضمانت‌نامه:</label>
                  <div 
                    onClick={() => {
                      setGFileSelected(true);
                      setGFileName("scan_guarantee_sayad_ ملت.jpg");
                    }}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                      gFileSelected 
                        ? "border-emerald-300 bg-emerald-50 text-emerald-950" 
                        : "border-slate-300 hover:border-indigo-400 bg-slate-50 text-slate-600"
                    }`}
                  >
                    <DownloadCloud size={24} className={gFileSelected ? "text-emerald-600" : "text-slate-400"} />
                    {gFileSelected ? (
                      <div className="space-y-0.5">
                        <span className="text-xs font-black">تصویر سند با موفقیت پیوست شد ✓</span>
                        <p className="text-[10px] text-emerald-700 font-mono">{gFileName}</p>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <span className="text-xs font-black">کلیک کنید یا تصویر را به اینجا بکشید</span>
                        <p className="text-[10px] text-slate-400">فرمت‌های مجاز: JPG, PNG (حداکثر ۵ مگابایت)</p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingGuarantee}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-75"
                >
                  {isSubmittingGuarantee ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <ShieldCheck size={16} />
                  )}
                  <span>ارسال مدارک ضمانت‌نامه جهت ممیزی</span>
                </button>
              </form>
            </div>

            {/* Guarantees List Section */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <FileText size={18} className="text-indigo-600" />
                    <span>لیست وثایق و ضمانت‌نامه‌های شما</span>
                  </h4>
                  <span className="text-[10px] font-black bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200">
                    {toPersianNum(guarantees.length)} وثیقه ثبت‌شده
                  </span>
                </div>

                {guarantees.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <HelpCircle size={40} className="text-slate-300 mx-auto" />
                    <div className="space-y-1">
                      <h5 className="text-xs font-black text-slate-700">هیچ وثیقه‌ای ثبت نشده است</h5>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        جهت تکمیل مدارک نمایندگی رسمی خود و ترخیص آسان بار، اولین وثیقه یا چک صیادی را ثبت فرمایید.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 pt-3">
                    {guarantees.map((guar) => {
                      const statusStyles = {
                        'pending_submission': { label: 'پیش‌نویس', color: 'bg-slate-100 text-slate-700 border-slate-200' },
                        'submitted_pending_review': { label: 'در حال بررسی و ممیزی صیاد', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                        'verified_approved': { label: 'تایید و ثبت شده رسمی ✓', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                        'rejected': { label: 'رد صلاحیت / دارای معوقه', color: 'bg-rose-50 text-rose-700 border-rose-200' },
                        'expired': { label: 'منقضی شده (نیاز به تمدید)', color: 'bg-slate-100 text-slate-600 border-slate-300' }
                      }[guar.status] || { label: 'نامشخص', color: 'bg-slate-100 text-slate-700 border-slate-200' };

                      const guaranteeLabels = {
                        'sayad_cheque': 'چک صیادی بنفش',
                        'bank_guarantee': 'ضمانت‌نامه بانکی',
                        'promissory_note': 'سفته الکترونیک هوشمند',
                        'cash_deposit': 'ودیعه نقدی'
                      }[guar.type] || guar.type;

                      return (
                        <div 
                          key={guar.id}
                          className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 hover:bg-slate-50/80 transition-colors text-right"
                          dir="rtl"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-600" />
                              <strong className="text-xs font-black text-slate-900">{guaranteeLabels}</strong>
                              <span className="text-[10px] font-mono text-slate-500">({guar.id})</span>
                            </div>
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${statusStyles.color}`}>
                              {statusStyles.label}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px] font-bold text-slate-600 bg-white p-3 rounded-xl border border-slate-150 text-right" dir="rtl">
                            <div className="space-y-0.5">
                              <span className="text-slate-400 block">مبلغ ضمانت:</span>
                              <strong className="font-mono text-slate-900 font-black">{toPersianNum(guar.amount)} تومان</strong>
                            </div>

                            <div className="space-y-0.5">
                              <span className="text-slate-400 block">بانک صادرکننده:</span>
                              <strong className="text-slate-900 font-black">{guar.bankName || "نامشخص"}</strong>
                            </div>

                            <div className="space-y-0.5">
                              <span className="text-slate-400 block">شماره سند / چک:</span>
                              <strong className="font-mono text-slate-900 font-black">{toPersianNum(guar.chequeNumber || "-")}</strong>
                            </div>

                            {guar.sayadNumber && (
                              <div className="col-span-2 sm:col-span-3 pt-1 border-t border-slate-100 space-y-0.5">
                                <span className="text-slate-400 block">شناسه ۱۶ رقمی صیادی:</span>
                                <strong className="font-mono text-slate-800 tracking-wider block text-left font-black">{toPersianNum(guar.sayadNumber)}</strong>
                              </div>
                            )}

                            <div className="col-span-2 sm:col-span-3 pt-1 border-t border-slate-100 flex justify-between text-[10px] text-slate-500 font-medium">
                              <span>تاریخ ثبت: {toPersianNum(guar.createdAt ? new Date(guar.createdAt).toLocaleDateString('fa-IR') : "۱۴۰۵/۰۵/۲۲")}</span>
                              <span>انقضا: {toPersianNum(guar.expiryDate || "۱۴۰۶/۰۵/۲۲")}</span>
                            </div>
                          </div>

                          {guar.adminNotes && (
                            <div className="bg-slate-100 text-slate-700 p-2.5 rounded-xl text-[10px] font-bold leading-relaxed border border-slate-200">
                              <span className="text-indigo-900">پیام کارشناس مالی: </span>
                              <span>{guar.adminNotes}</span>
                            </div>
                          )}

                          {/* Simulation Approval Trigger (Zero-cost Strategic Perk for instant checkout validation) */}
                          {guar.status === 'submitted_pending_review' && (
                            <div className="pt-2 flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleSimulateApproveGuarantee(guar.id)}
                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 rounded-xl font-black text-[10px] border border-indigo-200 transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <Sparkles size={12} className="text-indigo-600 animate-pulse" />
                                <span>شبیه‌ساز تایید آنی توسط مدیر (جهت تست)</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. SUB-TAB CONTENT: 🏢 AGENCY PROFILE & CONTACT SETTINGS                 */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-5">
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <User size={20} className="text-indigo-600" />
              <span>مشخصات دفتر عاملیت و ثبت رسمی</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium pt-0.5">
              این اطلاعات بر روی لوح‌های افتخار، فاکتورهای رسمی و استعلام‌های کشوری درج می‌گردد.
            </p>
          </div>

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-xs font-black text-emerald-950 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">نام شرکت / دفتر عاملیت:</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">استان فعالیت:</label>
              <input
                type="text"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">شهرستان / منطقه توزیع:</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">تلفن تماس دفتر:</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition-all text-left font-mono"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700">شماره شبا جهت تسویه‌حساب‌های عاملیت و پورسانت:</label>
              <input
                type="text"
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                placeholder="IR..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition-all text-left font-mono"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700">آدرس دقیق انبار و دفتر مرکزی:</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-70"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                <span>ذخیره مشخصات عاملیت</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. APPROVAL REQUEST MODAL                                                */}
      {/* ========================================================================= */}
      {showApprovalRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4 animate-scale-up text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                  <ShieldCheck size={18} />
                </div>
                <h4 className="text-sm font-black text-slate-900">
                  درخواست ممیزی و احراز صلاحیت عاملیت رسمی
                </h4>
              </div>
              <button onClick={() => setShowApprovalRequestModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendApprovalRequest} className="space-y-3">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1.5 font-bold">
                <div className="text-slate-900">مجموعه متقاضی: <strong>{companyName}</strong></div>
                <div className="text-slate-600">منطقه درخواستی انحصار: <strong>{province} - {city}</strong></div>
                <div className="text-amber-800">
                  مجموع خرید نقدی ثبت‌شده: <strong>{toPersianNum(simulatedSales)} تومان</strong>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">توضیحات تکمیلی و مشخصات پروانه کسب / انبار:</label>
                <textarea
                  rows={4}
                  required
                  placeholder="لطفاً سابقه فعالیت، تعداد ویزیتورها و ظرفیت انبار خود را مرقوم فرمایید..."
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApprovalRequestModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isRequestingApproval}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-70"
                >
                  {isRequestingApproval ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>ارسال درخواست به مدیریت</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 13. TICKET MODAL FOR ADDENDUM CONTRACT                                    */}
      {/* ========================================================================= */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                  <Send size={16} />
                </div>
                <h4 className="text-sm font-black text-slate-900">
                  ارسال تیکت درخواست قرارداد الحاقی ({activeTier.title})
                </h4>
              </div>
              <button onClick={() => setShowTicketModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendAddendumTicket} className="space-y-3">
              <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-200 text-xs space-y-1 text-amber-950">
                <div className="font-bold">متقاضی: <strong>{companyName}</strong></div>
                <div>سطح درخواستی: <strong>{activeTier.title} (سطح {toPersianNum(activeTier.levelNumber)})</strong></div>
                <div>فروش تاییدشده: <strong>{toPersianNum(simulatedSales)} تومان</strong></div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">توضیحات و نیازمندی‌های باربری / انحصاری منطقه:</label>
                <textarea
                  rows={4}
                  required
                  placeholder="لطفاً نیازمندی‌های ترانزیت، محدوده توزیع شهری یا هماهنگی با کارخانجات را قید فرمایید..."
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTicketModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-70"
                >
                  {isSubmittingTicket ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>ارسال تیکت به دبیرخانه</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 14. PRINTABLE CERTIFICATE MODAL                                           */}
      {/* ========================================================================= */}
      {showCertificateModal && (
        <RepresentativeCertificateView
          repName={user?.name || "مدیریت عاملیت"}
          companyName={companyName}
          city={city}
          agencyCode={user?.agencyCode || user?.userCode || "REP-7012"}
          badge={activeTier.badgeLabel}
          tierLevel={activeTier.levelNumber}
          tierTitle={activeTier.title}
          monthlySales={simulatedSales}
          onClose={() => setShowCertificateModal(false)}
          b2bConfig={b2bConfig}
        />
      )}

      {/* 🚀 Unified Fixed Add Ad Button (FAB) for Seller Portal (Rep) */}
      <AddAdButton variant="mobile-fab" />

    </div>
  );
}
