import React, { useState, useEffect, useMemo } from "react";
import { 
  Repeat, ArrowLeftRight, Plus, Search, Filter, ShieldCheck, 
  Building2, MapPin, Phone, Calendar, CheckCircle2, AlertCircle, 
  Sparkles, FileText, ChevronRight, X, MessageSquare, ArrowUpRight, 
  HelpCircle, Eye, RefreshCw, Send, Check, DollarSign, Package,
  Zap, Scale, Layers, Clock, Lock, CheckCircle, Truck, FileCheck,
  ShieldAlert, Award, FileSpreadsheet, Printer, ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../lib/data-layer";
import { collection, getDocs, doc, setDoc, updateDoc } from "../lib/data-layer";

export interface BarterItem {
  id: string;
  title: string;
  category: "raw_material" | "finished_goods" | "machinery" | "packaging" | "real_estate" | "other";
  offeredItem: string;
  offeredQty: string;
  offeredValue?: string; // Estimated total Toman value
  wantedItem: string;
  wantedQty: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  city: string;
  province?: string;
  description: string;
  createdAt: string;
  status: "active" | "negotiating" | "completed";
  isVerified: boolean;
  isUrgent?: boolean;
  viewsCount?: number;
  cashAdjustment?: string; // مابه‌التفاوت نقدی (در صورت وجود)
  escrowProtected?: boolean;
  qcVerified?: boolean;
}

const INITIAL_BARTER_DATA: BarterItem[] = [
  {
    id: "barter-deal-201",
    title: "معاوضه ۵۰۰ کارتن کیک دوقلو کاکائویی و بیسکویت کرم‌دار با شکر سفید کارخانه‌ای و پالت چوبی",
    category: "finished_goods",
    offeredItem: "کیک دوقلو شکلاتی و بیسکویت کرم‌دار با کیفیت صادراتی",
    offeredQty: "۵۰۰ کارتن (آماده بارگیری فوری)",
    offeredValue: "۱۴۵,۰۰۰,۰۰۰ تومان",
    wantedItem: "شکر سفید تصفیه‌شده کارخانه‌ای یا پالت چوبی استاندارد",
    wantedQty: "۳ تن شکر یا ۱۲۰ عدد پالت چوبی",
    companyName: "صنایع غذایی مینو ارس",
    contactPerson: "مهندس تبریزی (مدیر تامین)",
    phone: "۰۹۱۴۱۱۵۸۹۲۰",
    city: "تبریز",
    province: "آذربایجان شرقی",
    description: "بار تازه با ۶ ماه تاریخ انقضا و دارای سیب سلامت و گواهی استاندارد. تسویه مابه‌التفاوت از طریق صندوق امانی دست‌اول انجام می‌گردد.",
    createdAt: "امروز",
    status: "active",
    isVerified: true,
    isUrgent: true,
    viewsCount: 142,
    cashAdjustment: "تسویه نقدی مابه‌التفاوت از طریق حساب امانی دست‌اول",
    escrowProtected: true,
    qcVerified: true
  },
  {
    id: "barter-deal-202",
    title: "معاوضه ۴۰۰ کارتن رب گوجه‌فرنگی ۸۰۰ گرمی بریکس ۲۷ با قوطی خالی آسان‌بازشو و کارتن ۵ لایه",
    category: "packaging",
    offeredItem: "رب گوجه‌فرنگی غلیظ قوطی ۸۰۰ گرم با درب ایزی‌اوپن",
    offeredQty: "۴۰۰ کارتن (۴,۸۰۰ قوطی)",
    offeredValue: "۲۳۰,۰۰۰,۰۰۰ تومان",
    wantedItem: "قوطی فلزی خام ۸۰۰ گرمی یا کارتن ۵ لایه دایکاتی",
    wantedQty: "۶,۰۰۰ عدد قوطی یا ۱,۰۰۰ کارتن مادر",
    companyName: "کشت و صنعت گلنوش خراسان",
    contactPerson: "آقای رحمانی",
    phone: "۰۹۱۵۳۰۲۹۱۸۴",
    city: "مشهد",
    province: "خراسان رضوی",
    description: "تولید روز با نشان استاندارد و سیب سلامت رسمی. آماده تحویل درب کارخانه با تاییدیه بازرسی دست‌اول.",
    createdAt: "دیروز",
    status: "active",
    isVerified: true,
    isUrgent: false,
    viewsCount: 88,
    cashAdjustment: "توافقی با تضمین و داوری دست‌اول",
    escrowProtected: true,
    qcVerified: true
  },
  {
    id: "barter-deal-203",
    title: "معاوضه ۱۰ تن ماکارونی رشته‌ای و پاستا فرمی با روغن خوراکی عمده و آرد سوخاری",
    category: "finished_goods",
    offeredItem: "انواع اسپاگتی و ماکارونی فرمی سلفونی ۷۰۰ گرمی",
    offeredQty: "۱۰ تن (حدود ۱۴۰۰ کارتن)",
    offeredValue: "۳۸۰,۰۰۰,۰۰۰ تومان",
    wantedItem: "روغن سرخ‌کردنی حلب ۱۶ لیتری یا آرد سوخاری کیسه‌ای",
    wantedQty: "۴ تن روغن یا ۶ تن آرد سوخاری",
    companyName: "صنایع آرد و پاستا زرین‌دشت",
    contactPerson: "مهندس گودرزی",
    phone: "۰۹۱۲۶۴۰۵۵۱۱",
    city: "کرج",
    province: "البرز",
    description: "بسته‌بندی صادراتی و با انقضای ۱۸ ماهه. امکان بازدید حضوری و ارسال نمونه پیش از معاوضه.",
    createdAt: "۲ روز پیش",
    status: "active",
    isVerified: true,
    isUrgent: false,
    viewsCount: 215,
    cashAdjustment: "تسویه از طریق صندوق امانی دست اول",
    escrowProtected: true,
    qcVerified: true
  },
  {
    id: "barter-deal-204",
    title: "معاوضه دستگاه بسته‌بندی پیلوپک افقی اتوماتیک با رول سلفون BOPP و متالایز",
    category: "machinery",
    offeredItem: "دستگاه پیلوپک تمام استیل سرعت بالا با سیستم PLC و چشم الکترونیک",
    offeredQty: "۱ دستگاه (کم‌کارکرد در حد نو)",
    offeredValue: "۴۲۰,۰۰۰,۰۰۰ تومان",
    wantedItem: "رول سلفون صدفی، شفاف یا متالایز خط بسته‌بندی",
    wantedQty: "معادل ارزش کارشناسی دستگاه",
    companyName: "تجهیزات و ماشین‌سازی پارس‌تک",
    contactPerson: "مهندس نادری",
    phone: "۰۹۱۳۲۲۸۴۱۵۰",
    city: "اصفهان",
    province: "اصفهان",
    description: "دارای گارانتی ۶ ماهه و خدمات راه‌اندازی در محل کارخانه خریدار. با نظارت و داوری دست‌اول.",
    createdAt: "۳ روز پیش",
    status: "active",
    isVerified: true,
    isUrgent: true,
    viewsCount: 310,
    cashAdjustment: "تعدیل نقدی مابه‌التفاوت در صندوق امانی",
    escrowProtected: true,
    qcVerified: true
  }
];

interface BarterHallProps {
  user?: any;
  onNavigateHome?: () => void;
  onOpenAuth?: (role?: string) => void;
}

export const BarterHall: React.FC<BarterHallProps> = ({
  user,
  onNavigateHome,
  onOpenAuth
}) => {
  const [barters, setBarters] = useState<BarterItem[]>(INITIAL_BARTER_DATA);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedBarterForOffer, setSelectedBarterForOffer] = useState<BarterItem | null>(null);
  const [showContractPreview, setShowContractPreview] = useState<BarterItem | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingCodeInput, setTrackingCodeInput] = useState("");
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [showSafetyGuideModal, setShowSafetyGuideModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Barter Form State
  const [newBarter, setNewBarter] = useState({
    title: "",
    category: "finished_goods" as BarterItem["category"],
    offeredItem: "",
    offeredQty: "",
    offeredValue: "",
    wantedItem: "",
    wantedQty: "",
    companyName: user?.company || user?.name || "",
    contactPerson: user?.name || "",
    phone: user?.phone || "",
    city: user?.city || "تهران",
    description: "",
    cashAdjustment: "تسویه از طریق صندوق امانی دست اول",
    isUrgent: false,
    requestQcCheck: true,
    requestEscrowGuarantee: true
  });

  // Counter Offer Form State
  const [counterOffer, setCounterOffer] = useState({
    offeredProduct: "",
    quantity: "",
    estimatedValue: "",
    contactName: user?.name || "",
    contactPhone: user?.phone || "",
    city: user?.city || "تهران",
    description: "",
    requestEscrow: true,
    requestQc: true
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Load barters from Firestore and LocalStorage
  const loadBarters = async () => {
    setLoading(true);
    try {
      const localData = localStorage.getItem("dastavval_official_barters_v2") || localStorage.getItem("dastavval_barter_deals");
      let list: BarterItem[] = localData ? JSON.parse(localData) : [];

      if (!list || list.length === 0) {
        list = INITIAL_BARTER_DATA;
      }

      try {
        const snap = await getDocs(collection(db, "barter_deals"));
        if (!snap.empty) {
          const remoteList = snap.docs.map(d => ({ id: d.id, ...d.data() } as BarterItem));
          if (remoteList.length > 0) {
            list = remoteList;
          }
        }
      } catch (err) {
        console.warn("Firestore fetch error, using local fallback:", err);
      }

      setBarters(list);
      localStorage.setItem("dastavval_official_barters_v2", JSON.stringify(list));
      localStorage.setItem("dastavval_barter_deals", JSON.stringify(list));
    } catch (e) {
      console.error("Error loading barter data:", e);
      setBarters(INITIAL_BARTER_DATA);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBarters();

    const handleSync = () => {
      loadBarters();
    };

    window.addEventListener("dastavval_barter_updated", handleSync);
    window.addEventListener("dastavval_ads_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("dastavval_barter_updated", handleSync);
      window.removeEventListener("dastavval_ads_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  // Handle Barter Creation with DastAvval Guarantee
  const handleCreateBarter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBarter.title || !newBarter.offeredItem || !newBarter.wantedItem || !newBarter.phone) {
      alert("لطفاً فیلدهای اجباری را تکمیل فرمایید.");
      return;
    }

    const newItem: BarterItem = {
      id: `barter-${Date.now()}`,
      title: newBarter.title,
      category: newBarter.category,
      offeredItem: newBarter.offeredItem,
      offeredQty: newBarter.offeredQty || "مطابق توافق",
      offeredValue: newBarter.offeredValue ? `${newBarter.offeredValue} تومان` : "توافقی بر اساس نرخ روز کارخانه",
      wantedItem: newBarter.wantedItem,
      wantedQty: newBarter.wantedQty || "معادل ارزش بار پیشنهادی",
      companyName: newBarter.companyName || "مجموعه صنعتی همکار",
      contactPerson: newBarter.contactPerson || "مدیریت بازرگانی",
      phone: newBarter.phone,
      city: newBarter.city || "تهران",
      description: newBarter.description || "معاوضه مستقیم تحت نظارت، بازرسی کیفی و با پشتیبانی قرارداد و صندوق امانی دست اول صورت می‌پذیرد.",
      createdAt: "لحظاتی پیش",
      status: "active",
      isVerified: true,
      isUrgent: newBarter.isUrgent,
      viewsCount: 1,
      cashAdjustment: newBarter.cashAdjustment,
      escrowProtected: newBarter.requestEscrowGuarantee,
      qcVerified: newBarter.requestQcCheck
    };

    const updated = [newItem, ...barters];
    setBarters(updated);
    localStorage.setItem("dastavval_official_barters_v2", JSON.stringify(updated));
    localStorage.setItem("dastavval_barter_deals", JSON.stringify(updated));

    window.dispatchEvent(new CustomEvent("dastavval_barter_updated"));
    window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));

    try {
      await setDoc(doc(db, "barter_deals", newItem.id), newItem);
    } catch (e) {
      console.warn("Firestore save barter error:", e);
    }

    setIsSubmitModalOpen(false);
    showToast(`✅ پیشنهاد تهاتر شما با کد رهگیری ${newItem.id} و با پوشش صیانت امانی دست‌اول با موفقیت منتشر شد.`);
    
    // Reset Form
    setNewBarter({
      title: "",
      category: "finished_goods",
      offeredItem: "",
      offeredQty: "",
      offeredValue: "",
      wantedItem: "",
      wantedQty: "",
      companyName: user?.company || user?.name || "",
      contactPerson: user?.name || "",
      phone: user?.phone || "",
      city: user?.city || "تهران",
      description: "",
      cashAdjustment: "تسویه از طریق صندوق امانی دست اول",
      isUrgent: false,
      requestQcCheck: true,
      requestEscrowGuarantee: true
    });
  };

  // Handle counter offer submission with DastAvval escrow
  const handleSubmitCounterOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterOffer.offeredProduct || !counterOffer.contactPhone) {
      alert("لطفاً کالای پیشنهادی و شماره تماس خود را وارد نمایید.");
      return;
    }

    const escrowCode = `ESCROW-BT-${Math.floor(100000 + Math.random() * 900000)}`;
    showToast(`✅ پرونده تهاتر امن با کد پیگیری ${escrowCode} برای «${selectedBarterForOffer?.companyName}» تشکیل شد. کارشناس ارزیاب دست‌اول جهت هماهنگی بازرسی و توثیق تماس خواهد گرفت.`);
    setSelectedBarterForOffer(null);
    setCounterOffer({
      offeredProduct: "",
      quantity: "",
      estimatedValue: "",
      contactName: user?.name || "",
      contactPhone: user?.phone || "",
      city: user?.city || "تهران",
      description: "",
      requestEscrow: true,
      requestQc: true
    });
  };

  // Handle tracking code lookup
  const handleTrackBarter = (e: React.FormEvent) => {
    e.preventDefault();
    const code = trackingCodeInput.trim().toLowerCase();
    if (!code) return;

    const matched = barters.find(b => b.id.toLowerCase() === code || code.includes(b.id.toLowerCase().replace('barter-', '')));
    if (matched) {
      setTrackingResult({
        item: matched,
        escrowCode: `ESCROW-BT-${matched.id.replace('barter-', '')}`,
        currentStep: matched.status === 'completed' ? 5 : matched.status === 'negotiating' ? 3 : 2,
        qcStatus: matched.qcVerified ? "تایید کارشناسی کیفی و بهداشتی صادر شده است" : "در نوبت اعزام کارشناس ارزیاب",
        escrowStatus: matched.escrowProtected ? "حساب امانی فعال و تضامین در تعهد دست‌اول" : "در انتظار توافق مالی نهایی طرفین",
        logisticsStatus: "بارگیری و صدور بارنامه هوشمند دست‌اول"
      });
    } else {
      setTrackingResult({
        item: {
          id: code.toUpperCase(),
          title: "پرونده تهاتر در گردش سامانه امانی",
          companyName: "صنایع غذایی طرف قرارداد",
          offeredItem: "محموله کالای صنعتی / مواد اولیه",
          wantedItem: "محصولات تقاضاشده",
          city: "تهران"
        },
        escrowCode: code.toUpperCase(),
        currentStep: 2,
        qcStatus: "استعلام سلامت و کد بهداشتی IRC تایید شد",
        escrowStatus: "بلوکه شدن مابه‌التفاوت در صندوق امانی دست‌اول",
        logisticsStatus: "هماهنگی ناوگان حمل اختصاصی دست‌اول"
      });
    }
  };

  // Filter Barters
  const filteredBarters = useMemo(() => {
    return barters.filter(item => {
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || 
        item.title.toLowerCase().includes(q) ||
        item.offeredItem.toLowerCase().includes(q) ||
        item.wantedItem.toLowerCase().includes(q) ||
        item.companyName.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q);

      return matchesCategory && matchesQuery;
    });
  }, [barters, selectedCategory, searchQuery]);

  const categories = [
    { id: "all", label: "همه معاوضه‌ها", icon: Layers },
    { id: "finished_goods", label: "مازاد تولید و کالای آماده", icon: Package },
    { id: "raw_material", label: "مواد اولیه غذایی", icon: Scale },
    { id: "machinery", label: "تجهیزات و ماشین‌آلات", icon: Zap },
    { id: "packaging", label: "کارتن و بسته‌بندی", icon: Repeat },
    { id: "real_estate", label: "انبار و املاک صنعتی", icon: Building2 },
  ];

  return (
    <div className="w-full bg-slate-50 text-slate-900 pb-16 text-right" dir="rtl">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] bg-emerald-800 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500 font-bold text-xs max-w-lg w-[92%]"
          >
            <CheckCircle2 size={22} className="shrink-0 text-emerald-300" />
            <span className="leading-relaxed">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🌟 COMPACT & COLLAPSIBLE HERO HEADER */}
      <div className="bg-white text-slate-900 rounded-3xl p-4 sm:p-6 shadow-xs border border-slate-200/90 relative mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 flex items-center gap-2">
                <Repeat size={20} className="text-emerald-700" />
                <span>تالار تهاتر و معاوضه صنعتی کالا</span>
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black">
                <ShieldCheck size={12} className="text-emerald-700" />
                <span>تضمین صندوق امانی</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium line-clamp-1 sm:line-clamp-none">
              معاوضه امن مازاد تولید، مواد اولیه و تجهیزات کارخانجات با تضمین بازرسی و صیانت مالی دست‌اول.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                if (!user) {
                  onOpenAuth?.("factory");
                } else {
                  setIsSubmitModalOpen(true);
                }
              }}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-black text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus size={15} />
              <span>ثبت پیشنهاد تهاتر</span>
            </button>

            <button
              onClick={() => setShowTrackingModal(true)}
              className="px-3 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
            >
              <Search size={13} className="text-slate-500" />
              <span>پیگیری پرونده</span>
            </button>

            <button
              onClick={() => setShowSafetyGuideModal(prev => !prev)}
              className="px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck size={14} className="text-emerald-700" />
              <span>{showSafetyGuideModal ? "بستن راهنما ▲" : "مراحل ۵‌گانه تهاتر ▼"}</span>
            </button>
          </div>
        </div>

        {/* 🛡️ COLLAPSIBLE 5-STEP SECURE WORKFLOW */}
        <AnimatePresence>
          {showSafetyGuideModal && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden pt-4 mt-4 border-t border-slate-100"
            >
              <div className="bg-slate-50/90 rounded-2xl p-3 sm:p-4 border border-slate-200">
                <div className="text-[11px] font-black text-slate-800 mb-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock size={13} className="text-emerald-700" />
                    <span>مراحل ۵‌گانه اجرای تهاتر ایمن تحت نظارت دست‌اول:</span>
                  </span>
                  <button 
                    onClick={() => setShowSafetyGuideModal(false)}
                    className="text-slate-400 hover:text-slate-700 text-[10px] font-bold cursor-pointer"
                  >
                    بستن
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-3xs space-y-0.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-700 text-white font-black text-[9px] inline-flex items-center justify-center">۱</span>
                    <p className="font-black text-slate-900 text-[10px]">ثبت و استعلام</p>
                    <p className="text-[8px] text-slate-500">تعیین ارزش و کالاها</p>
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-3xs space-y-0.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-700 text-white font-black text-[9px] inline-flex items-center justify-center">۲</span>
                    <p className="font-black text-slate-900 text-[10px]">بازرسی کیفی QC</p>
                    <p className="text-[8px] text-slate-500">تطبیق سلامت و تاریخ</p>
                  </div>

                  <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-300 shadow-3xs space-y-0.5">
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-white font-black text-[9px] inline-flex items-center justify-center">۳</span>
                    <p className="font-black text-emerald-950 text-[10px]">صندوق امانی</p>
                    <p className="text-[8px] text-emerald-800">تضمین مابه‌التفاوت</p>
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-3xs space-y-0.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-700 text-white font-black text-[9px] inline-flex items-center justify-center">۴</span>
                    <p className="font-black text-slate-900 text-[10px]">بارگیری با بارنامه</p>
                    <p className="text-[8px] text-slate-500">حمل همزمان بیمه‌شده</p>
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-3xs space-y-0.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-700 text-white font-black text-[9px] inline-flex items-center justify-center">۵</span>
                    <p className="font-black text-slate-900 text-[10px]">تحویل و تسویه</p>
                    <p className="text-[8px] text-slate-500">تایید انبار مقصد</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SEARCH AND COMPACT CATEGORY FILTER TOOLBAR */}
      <div className="bg-white rounded-3xl p-3 sm:p-4 border border-slate-200 shadow-3xs space-y-3 mb-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="جستجوی کالا، کارخانه یا شهر در تالار تهاتر..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-7 py-2 text-xs font-bold text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-600 transition-all text-right"
            />
            <Search size={15} className="absolute right-3 top-2.5 text-slate-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute left-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={loadBarters}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer"
              title="به‌روزرسانی آگهی‌ها"
            >
              <RefreshCw size={13} className="text-emerald-700" />
              <span className="hidden sm:inline">به‌روزرسانی</span>
            </button>

            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200">
              {filteredBarters.length} معاوضه
            </span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer border ${
                  isSelected
                    ? "bg-emerald-800 text-white border-emerald-800 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Icon size={14} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* BARTER LISTINGS GRID */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200 animate-pulse h-64" />
          ))}
        </div>
      ) : filteredBarters.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-slate-300 space-y-4">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-600">
            <ArrowLeftRight size={32} />
          </div>
          <h3 className="text-base font-black text-slate-800">موردی با مشخصات انتخابی یافت نشد</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
            شما می‌توانید پیشنهاد تهاتر کالای مازاد یا مواد اولیه خود را ثبت فرمایید تا کارخانجات متقاضی متصل شوند.
          </p>
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
          >
            ثبت پیشنهاد معاوضه جدید
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredBarters.map((item, idx) => (
            <motion.div
              key={`barter-item-${item.id}-${idx}`}
              layout
              className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
            >
              {/* Header Badge Area */}
              <div className="p-5 border-b border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-lg border border-emerald-200">
                      {item.category === "finished_goods" ? "مازاد تولید و محصول نهایی" :
                       item.category === "raw_material" ? "مواد اولیه خط تولید" :
                       item.category === "machinery" ? "ماشین‌آلات و تجهیزات" :
                       item.category === "packaging" ? "کارتن و بسته‌بندی" : "املاک و انبار"}
                    </span>
                    <span className="text-[10px] font-black bg-teal-100 text-teal-900 px-2 py-0.5 rounded-lg border border-teal-200 flex items-center gap-1">
                      <ShieldCheck size={12} className="text-teal-700" />
                      <span>تضمین امانی دست‌اول</span>
                    </span>
                    {item.isUrgent && (
                      <span className="text-[10px] font-black bg-rose-100 text-rose-700 px-2 py-0.5 rounded-lg border border-rose-200 flex items-center gap-1">
                        <Zap size={11} />
                        <span>فوری</span>
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400 font-bold flex items-center gap-1 shrink-0">
                    <Clock size={12} />
                    <span>{item.createdAt}</span>
                  </div>
                </div>

                <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug group-hover:text-emerald-800 transition-colors">
                  {item.title}
                </h3>
              </div>

              {/* Offer vs Want Split Box */}
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50 border-b border-slate-100 text-right">
                {/* What is Offered (موجود برای واگذاری) */}
                <div className="bg-white p-3 rounded-2xl border border-emerald-200 shadow-2xs space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-black text-[11px]">
                    <Package size={14} />
                    <span>کالای ارائه‌شده (موجود):</span>
                  </div>
                  <p className="text-xs font-black text-slate-900 line-clamp-1">{item.offeredItem}</p>
                  <p className="text-[11px] text-slate-600 font-medium">{item.offeredQty}</p>
                  {item.offeredValue && (
                    <div className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                      ارزش تخمینی: {item.offeredValue}
                    </div>
                  )}
                </div>

                {/* What is Wanted (متقاضی دریافت) */}
                <div className="bg-white p-3 rounded-2xl border border-teal-200 shadow-2xs space-y-1">
                  <div className="flex items-center gap-1.5 text-teal-800 font-black text-[11px]">
                    <Repeat size={14} />
                    <span>درخواست معاوضه با:</span>
                  </div>
                  <p className="text-xs font-black text-slate-900 line-clamp-1">{item.wantedItem}</p>
                  <p className="text-[11px] text-slate-600 font-medium">{item.wantedQty}</p>
                  {item.cashAdjustment && (
                    <div className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md inline-block">
                      {item.cashAdjustment}
                    </div>
                  )}
                </div>
              </div>

              {/* Company & Description Body */}
              <div className="p-4 space-y-2.5 flex-1 text-right">
                <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-2">
                  {item.description}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-slate-500 font-bold border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Building2 size={13} className="text-slate-400" />
                    <span className="text-slate-800">{item.companyName}</span>
                    <span className="text-slate-400">({item.contactPerson})</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <MapPin size={13} className="text-slate-400" />
                    <span>{item.city} {item.province ? `- ${item.province}` : ""}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Interactive Actions */}
              <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => setShowContractPreview(item)}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <FileText size={13} className="text-emerald-700" />
                  <span>پیش‌نویس قرارداد سه جانبه</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${item.phone}`}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-black transition-all flex items-center gap-1.5 shadow-2xs"
                  >
                    <Phone size={13} className="text-emerald-700" />
                    <span>تماس مستقیم</span>
                  </a>

                  <button
                    onClick={() => {
                      if (!user) {
                        onOpenAuth?.("customer");
                      } else {
                        setSelectedBarterForOffer(item);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <ShieldCheck size={14} className="text-emerald-200" />
                    <span>تهاتر با ضمانت دست‌اول</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* 📜 MODAL 1: SUBMIT NEW BARTER WITH DASTAVVAL GUARANTEE */}
      <AnimatePresence>
        {isSubmitModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col text-right"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-700 text-white rounded-2xl flex items-center justify-center shadow-md">
                    <Repeat size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">ثبت پیشنهاد تهاتر رسمی تحت صیانت دست‌اول</h3>
                    <p className="text-[11px] text-slate-500 font-bold">معاوضه با تضمین کیفی و تسویه مابه‌التفاوت در صندوق امانی</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleCreateBarter} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                <div className="space-y-1.5">
                  <label className="font-black text-slate-800 block">عنوان آگهی معاوضه:</label>
                  <input
                    type="text"
                    required
                    value={newBarter.title}
                    onChange={e => setNewBarter({ ...newBarter, title: e.target.value })}
                    placeholder="مثال: معاوضه ۳۰۰ کارتن تن ماهی با قوطی خالی و کارتن بسته‌بندی"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-black text-slate-800 block">دسته‌بندی اصلی:</label>
                    <select
                      value={newBarter.category}
                      onChange={e => setNewBarter({ ...newBarter, category: e.target.value as any })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-emerald-600 outline-none"
                    >
                      <option value="finished_goods">مازاد تولید و محصولات غذایی</option>
                      <option value="raw_material">مواد اولیه خط تولید</option>
                      <option value="machinery">تجهیزات و ماشین‌آلات صنعتی</option>
                      <option value="packaging">کارتن، فیلم و ملزومات بسته‌بندی</option>
                      <option value="real_estate">انبار و سوله صنعتی</option>
                      <option value="other">سایر اقلام تجاری</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-black text-slate-800 block">شهر و استان محل بارگیری:</label>
                    <input
                      type="text"
                      required
                      value={newBarter.city}
                      onChange={e => setNewBarter({ ...newBarter, city: e.target.value })}
                      placeholder="مثال: تبریز / تهران"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-emerald-600 outline-none"
                    />
                  </div>
                </div>

                {/* Offered Item Area */}
                <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-3">
                  <h4 className="font-black text-emerald-950 flex items-center gap-1.5 text-xs">
                    <Package size={15} />
                    <span>مشخصات کالایی که واگذار می‌نمایید (پیشنهاد موجود شما):</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={newBarter.offeredItem}
                      onChange={e => setNewBarter({ ...newBarter, offeredItem: e.target.value })}
                      placeholder="نام دقیق کالا (مثال: کیک دوقلو کاکائویی)"
                      className="p-2.5 bg-white border border-emerald-300 rounded-xl font-bold outline-none"
                    />
                    <input
                      type="text"
                      value={newBarter.offeredQty}
                      onChange={e => setNewBarter({ ...newBarter, offeredQty: e.target.value })}
                      placeholder="تعداد یا تناژ (مثال: ۵۰۰ کارتن)"
                      className="p-2.5 bg-white border border-emerald-300 rounded-xl font-bold outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    value={newBarter.offeredValue}
                    onChange={e => setNewBarter({ ...newBarter, offeredValue: e.target.value })}
                    placeholder="ارزش تخمینی بار (تومان) - مثال: ۴۵۰,۰۰۰,۰۰۰ تومان"
                    className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl font-bold outline-none"
                  />
                </div>

                {/* Wanted Item Area */}
                <div className="p-4 bg-teal-50/80 border border-teal-200 rounded-2xl space-y-3">
                  <h4 className="font-black text-teal-950 flex items-center gap-1.5 text-xs">
                    <Repeat size={15} />
                    <span>کالایی که در ازای آن تقاضا دارید (درخواست شما):</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={newBarter.wantedItem}
                      onChange={e => setNewBarter({ ...newBarter, wantedItem: e.target.value })}
                      placeholder="کالای مورد نیاز (مثال: شکر سفید یا قوطی فلزی)"
                      className="p-2.5 bg-white border border-teal-300 rounded-xl font-bold outline-none"
                    />
                    <input
                      type="text"
                      value={newBarter.wantedQty}
                      onChange={e => setNewBarter({ ...newBarter, wantedQty: e.target.value })}
                      placeholder="مقدار درخواستی (مثال: ۸ تن)"
                      className="p-2.5 bg-white border border-teal-300 rounded-xl font-bold outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    value={newBarter.cashAdjustment}
                    onChange={e => setNewBarter({ ...newBarter, cashAdjustment: e.target.value })}
                    placeholder="شرایط مابه‌التفاوت (مثال: تسویه از طریق صندوق امانی دست‌اول)"
                    className="w-full p-2.5 bg-white border border-teal-300 rounded-xl font-bold outline-none"
                  />
                </div>

                {/* Company & Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-black text-slate-700 block">نام شرکت / کارخانه:</label>
                    <input
                      type="text"
                      value={newBarter.companyName}
                      onChange={e => setNewBarter({ ...newBarter, companyName: e.target.value })}
                      placeholder="مثال: صنایع غذایی نوین"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-black text-slate-700 block">نام مسئول پیگیری:</label>
                    <input
                      type="text"
                      value={newBarter.contactPerson}
                      onChange={e => setNewBarter({ ...newBarter, contactPerson: e.target.value })}
                      placeholder="مثال: مهندس حسینی"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-black text-slate-700 block">شماره تماس همراه:</label>
                    <input
                      type="tel"
                      required
                      value={newBarter.phone}
                      onChange={e => setNewBarter({ ...newBarter, phone: e.target.value })}
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-left outline-none"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="font-black text-slate-800 block">توضیحات تکمیلی و شرایط استاندارد و بارگیری:</label>
                  <textarea
                    rows={3}
                    value={newBarter.description}
                    onChange={e => setNewBarter({ ...newBarter, description: e.target.value })}
                    placeholder="مشخصات پروانه بهداشتی، سیب سلامت، محل بارانداز و شرایط مورد نظر خود را ذکر فرمایید..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-emerald-600 outline-none resize-none"
                  />
                </div>

                {/* DastAvval Guarantee Safeguards */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newBarter.requestQcCheck}
                      onChange={e => setNewBarter({ ...newBarter, requestQcCheck: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-bold text-slate-800">متقاضی بازرسی و کارشناسی کیفی دست‌اول پیش از بارگیری</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newBarter.requestEscrowGuarantee}
                      onChange={e => setNewBarter({ ...newBarter, requestEscrowGuarantee: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-bold text-slate-800">پوشش تسویه مابه‌التفاوت و صدور تضامین توسط صندوق امانی دست‌اول</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newBarter.isUrgent}
                      onChange={e => setNewBarter({ ...newBarter, isUrgent: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-bold text-rose-700">این پیشنهاد دارای اولویت واگذاری فوری است</span>
                  </label>
                </div>

                {/* Submit Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-black shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Check size={16} />
                    <span>تایید و انتشار رسمی آگهی با ضمانت دست‌اول</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🤝 MODAL 2: SEND OFFICIAL DASTAVVAL SECURE BARTER OFFER */}
      <AnimatePresence>
        {selectedBarterForOffer && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto text-right"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900">ارسال پیشنهاد معاوضه با پوشش امانی دست‌اول</h3>
                  <p className="text-[11px] text-slate-500 font-bold mt-0.5">طرف معامله: {selectedBarterForOffer.companyName}</p>
                </div>
                <button
                  onClick={() => setSelectedBarterForOffer(null)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Target info card */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-700">کالای درخواستی آگهی‌دهنده:</span>
                  <span className="font-black text-emerald-800">{selectedBarterForOffer.wantedItem}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>کالای ارائه‌شده در ازای آن:</span>
                  <span className="font-bold text-slate-800">{selectedBarterForOffer.offeredItem}</span>
                </div>
              </div>

              <form onSubmit={handleSubmitCounterOffer} className="space-y-3.5 text-xs">
                <div className="space-y-1.5">
                  <label className="font-black text-slate-800 block">مشخصات دقیق کالایی که برای تهاتر پیشنهاد می‌دهید:</label>
                  <input
                    type="text"
                    required
                    value={counterOffer.offeredProduct}
                    onChange={e => setCounterOffer({ ...counterOffer, offeredProduct: e.target.value })}
                    placeholder="مثال: ۸ تن شکر کارخانه‌ای یا ۴۰۰ کارتن روغن"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-black text-slate-800 block">مقدار / تناژ پیشنهادی:</label>
                    <input
                      type="text"
                      value={counterOffer.quantity}
                      onChange={e => setCounterOffer({ ...counterOffer, quantity: e.target.value })}
                      placeholder="مثال: ۵۰۰ کارتن"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-black text-slate-800 block">ارزش تخمینی بار (تومان):</label>
                    <input
                      type="text"
                      value={counterOffer.estimatedValue}
                      onChange={e => setCounterOffer({ ...counterOffer, estimatedValue: e.target.value })}
                      placeholder="مثال: ۴۰۰,۰۰۰,۰۰۰ تومان"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-black text-slate-800 block">نام شما / مجموعه صنعتی:</label>
                    <input
                      type="text"
                      required
                      value={counterOffer.contactName}
                      onChange={e => setCounterOffer({ ...counterOffer, contactName: e.target.value })}
                      placeholder="نام نماینده بازرگانی"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-black text-slate-800 block">شماره تماس مستقیم همراه:</label>
                    <input
                      type="tel"
                      required
                      value={counterOffer.contactPhone}
                      onChange={e => setCounterOffer({ ...counterOffer, contactPhone: e.target.value })}
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-left outline-none"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-black text-slate-800 block">توضیحات شرایط بار، کیفیت و تاریخ تحویل:</label>
                  <textarea
                    rows={3}
                    value={counterOffer.description}
                    onChange={e => setCounterOffer({ ...counterOffer, description: e.target.value })}
                    placeholder="توضیحات تکمیلی در خصوص دارا بودن مجوز بهداشت، محل انبار و نحوه تسویه مابه‌التفاوت..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none resize-none"
                  />
                </div>

                {/* Guarantee check badges */}
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1.5 text-[11px] text-emerald-950 font-bold">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-700" />
                    <span>تطبیق کارشناسی سلامت بار توسط ناظر دست‌اول انجام می‌گیرد.</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-700" />
                    <span>مابه‌التفاوت ریالی در حساب امانی دست‌اول تا زمان تحویل ایمن مسدود می‌ماند.</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-black shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-xs"
                >
                  <ShieldCheck size={16} />
                  <span>ثبت رسمی پرونده تهاتر و دریافت کد رهگیری صیانت</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📄 MODAL 3: OFFICIAL TRIPARTITE BARTER CONTRACT PREVIEW */}
      <AnimatePresence>
        {showContractPreview && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto text-right"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                    <Scale size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">پیش‌نویس قرارداد سه جانبه تهاتر صنعتی و تامین کالا</h3>
                    <p className="text-xs text-slate-500 font-bold">با عاملیت، نظارت کارشناسی و داوری مرضی‌الطرفین سامانه ملی دست‌اول</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowContractPreview(null)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Printable Contract Document Mockup */}
              <div className="bg-slate-50 border border-slate-300 rounded-2xl p-5 space-y-3.5 text-xs leading-relaxed text-slate-800 font-medium">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-black text-slate-900">قرارداد تهاتر شماره: <span className="font-mono text-emerald-800">{showContractPreview.id}</span></span>
                  <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold text-[10px]">تحت پوشش صندوق امانی دست‌اول</span>
                </div>

                <div>
                  <span className="font-black text-emerald-950">ماده ۱: طرفین قرارداد: </span>
                  شرکت/مجموعه {showContractPreview.companyName} (طرف اول)، متقاضی تهاتر تایید هویت شده (طرف دوم) و پلتفرم دست‌اول به عنوان رکن ناظر، ارزیاب کیفی و مجری حساب امانی (طرف سوم).
                </div>

                <div>
                  <span className="font-black text-emerald-950">ماده ۲: موضوع معاوضه: </span>
                  واگذاری «{showContractPreview.offeredItem}» به مقدار «{showContractPreview.offeredQty}» در قبال تحویل کالای متقابل «{showContractPreview.wantedItem}» به میزان «{showContractPreview.wantedQty}».
                </div>

                <div>
                  <span className="font-black text-emerald-950">ماده ۳: تضمین کیفیت، اصالت و بازرسی: </span>
                  تطبیق مجوزهای بهداشتی، سیب سلامت و استانداردهای کیفی بار طرفین پیش از بارگیری توسط کارشناس رسمی دست‌اول ارزیابی و تایید می‌گردد.
                </div>

                <div>
                  <span className="font-black text-emerald-950">ماده ۴: حساب امانی و تعدیل مابه‌التفاوت: </span>
                  کلیه مابه‌التفاوت‌های ریالی احتمالی در حساب امانی دست‌اول تودیع گردیده و پس از تحویل‌گیری نهایی در انبار مقصد آزادسازی می‌شود.
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-300 text-center font-black text-[10px]">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    امضا و مهر طرف اول<br />
                    <span className="text-slate-400 text-[9px] mt-1 block">({showContractPreview.companyName})</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    امضا و مهر طرف دوم<br />
                    <span className="text-slate-400 text-[9px] mt-1 block">(متقاضی تاییدشده)</span>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-300 text-emerald-900">
                    مهر و ضمانت عاملیت<br />
                    <span className="text-emerald-700 text-[9px] mt-1 block">(صندوق امانی دست‌اول)</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Printer size={14} />
                  <span>چاپ نسخه رسمی</span>
                </button>

                <button
                  onClick={() => {
                    setShowContractPreview(null);
                    setSelectedBarterForOffer(showContractPreview);
                  }}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck size={15} />
                  <span>ثبت درخواست معاوضه تحت نظارت دست‌اول</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🔍 MODAL 4: BARTER TRACKING MODAL */}
      <AnimatePresence>
        {showTrackingModal && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 text-right"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center font-bold">
                    <Search size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">استعلام و پیگیری پرونده تهاتر امن</h3>
                    <p className="text-[10px] text-slate-500 font-bold">رهگیری مراحل بازرسی، صندوق امانی و بارگیری</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowTrackingModal(false);
                    setTrackingResult(null);
                  }}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleTrackBarter} className="flex gap-2">
                <input
                  type="text"
                  value={trackingCodeInput}
                  onChange={e => setTrackingCodeInput(e.target.value)}
                  placeholder="کد پرونده تهاتر (مثال: barter-101 یا ESCROW-BT-101)"
                  className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none focus:bg-white focus:border-emerald-600"
                />
                <button
                  type="submit"
                  className="px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black cursor-pointer shrink-0"
                >
                  استعلام
                </button>
              </form>

              {trackingResult && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-black text-slate-900">{trackingResult.item.title}</span>
                    <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                      {trackingResult.escrowCode}
                    </span>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold">
                      <CheckCircle size={14} />
                      <span>{trackingResult.qcStatus}</span>
                    </div>
                    <div className="flex items-center gap-2 text-teal-800 font-bold">
                      <ShieldCheck size={14} />
                      <span>{trackingResult.escrowStatus}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 font-bold">
                      <Truck size={14} />
                      <span>{trackingResult.logisticsStatus}</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🛡️ MODAL 5: SAFETY PROTOCOL GUIDE */}
      <AnimatePresence>
        {showSafetyGuideModal && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 text-right"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">پروتکل صیانت و تهاتر امن دست‌اول</h3>
                    <p className="text-[11px] text-slate-500 font-bold">راهنمای حذف ریسک در معاوضه کالا و ماشین‌آلات</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSafetyGuideModal(false)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-700 font-medium">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <h4 className="font-black text-slate-900 flex items-center gap-1.5 text-xs">
                    <Award size={14} className="text-emerald-700" />
                    <span>۱. احراز هویت کارخانجات و انبارها</span>
                  </h4>
                  <p className="text-[11px] text-slate-600">تمامی شرکت‌ها با شناسه ملی و پروانه تولید استعلام شده‌اند.</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <h4 className="font-black text-slate-900 flex items-center gap-1.5 text-xs">
                    <CheckCircle2 size={14} className="text-emerald-700" />
                    <span>۲. کارشناسی تطبیق کیفی و سلامت IRC</span>
                  </h4>
                  <p className="text-[11px] text-slate-600">بار پیش از بارگیری از نظر انقضا و اصالت توسط کارشناس ناظر تایید می‌شود.</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <h4 className="font-black text-slate-900 flex items-center gap-1.5 text-xs">
                    <ShieldCheck size={14} className="text-emerald-700" />
                    <span>۳. صندوق امانی و بیمه مابه‌التفاوت</span>
                  </h4>
                  <p className="text-[11px] text-slate-600">ارزش مابه‌التفاوت در حساب امن دست‌اول نگهداری و پس از تحویل نهایی تسویه می‌گردد.</p>
                </div>
              </div>

              <button
                onClick={() => setShowSafetyGuideModal(false)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs cursor-pointer"
              >
                متوجه شدم
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BarterHall;
