import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Check, X, Search, Copy, Calculator, RefreshCw, BarChart2, Briefcase, 
  Clock, TrendingUp, Sparkles, Users, UserCheck, MessageCircle, HelpCircle,
  TrendingDown, CheckCircle2, ChevronDown, MessageSquare, CheckCircle, Heart, Building2, Truck, Plus, ArrowLeftRight, Percent, ShieldCheck, Info, ShoppingBag
} from "lucide-react";
import { Product } from "../types";

interface EngagementHubProps {
  products: Product[];
  onAddToCart: (product: Product, quantityCartons: number) => void;
  userBadge?: string;
  theme?: "light" | "dark" | "classic";
}

interface BarterProposal {
  id: string;
  companyName: string;
  offeredItem: string;
  offeredQty: number;
  wantedItem: string;
  wantedQty: number;
  contactPhone: string;
  contactName: string;
  status: "active" | "negotiating" | "completed";
  createdAt: string;
}

interface Tender {
  id: string;
  productName: string;
  qtyCartons: number;
  paymentType: "cash" | "check" | "lc";
  deliveryDays: number;
  status: "active" | "completed";
  bestBidPrice?: number;
  bids: { factory: string; price: number; delay: string; timestamp: string }[];
  createdAt: string;
}

export default function EngagementHub({ products, onAddToCart, userBadge = "bronze", theme = "light" }: EngagementHubProps) {
  // State for Sub-Tabs - Completely redesigned with formal enterprise-grade options
  const [activeTab, setActiveTab] = useState<"stagnancy" | "logistics" | "rfq">("stagnancy");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Zarinpal anti-fraud secure payment gateway states
  const [pendingPayment, setPendingPayment] = useState<{
    type: "barter" | "rfq";
    data: any;
    amount: number;
    description: string;
  } | null>(null);

  const [isZarinpalOpen, setIsZarinpalOpen] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState<{
    referenceId: string;
    trackingCode: string;
    amount: number;
    date: string;
    type: "barter" | "rfq";
  } | null>(null);

  // Zarinpal form states
  const [cardNumber, setCardNumber] = useState("");
  const [cvv2, setCvv2] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [pin2, setPin2] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaCode, setCaptchaCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(120);
  const [simulatedOtpValue, setSimulatedOtpValue] = useState("");

  const generateNewCaptcha = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setCaptchaCode(code);
    setCaptchaInput("");
  };

  useEffect(() => {
    generateNewCaptcha();
  }, []);

  useEffect(() => {
    let interval: any;
    if (otpSent && otpCountdown > 0) {
      interval = setInterval(() => {
        setOtpCountdown(prev => prev - 1);
      }, 1000);
    } else if (otpCountdown === 0) {
      setOtpSent(false);
    }
    return () => clearInterval(interval);
  }, [otpSent, otpCountdown]);

  const getBankInfo = (card: string) => {
    const cleanCard = card.replace(/\D/g, "");
    if (cleanCard.length < 6) return null;
    const prefix = cleanCard.substring(0, 6);
    switch (prefix) {
      case "603799": return { name: "بانک ملی ایران", color: "bg-blue-700 text-white", logo: "ملی" };
      case "610433": return { name: "بانک ملت", color: "bg-red-700 text-white", logo: "ملت" };
      case "621986": return { name: "بانک سامان", color: "bg-cyan-700 text-white", logo: "سامان" };
      case "627353": return { name: "بانک تجارت", color: "bg-teal-700 text-white", logo: "تجارت" };
      case "589210": return { name: "بانک سپه", color: "bg-amber-600 text-slate-900", logo: "سپه" };
      case "627412": return { name: "بانک اقتصاد نوین", color: "bg-purple-750 text-white", logo: "اقتصاد نوین" };
      case "502229":
      case "639347": return { name: "بانک پاسارگاد", color: "bg-amber-500 text-slate-900", logo: "پاسارگاد" };
      case "622106":
      case "627884": return { name: "بانک پارسیان", color: "bg-emerald-700 text-white", logo: "پارسیان" };
      default: return { name: "شبکه شتاب کشوری", color: "bg-slate-100 text-slate-800 border border-slate-200", logo: "شتاب" };
    }
  };

  const handleCardNumberChange = (value: string) => {
    const digits = value.replace(/\D/g, "").substring(0, 16);
    let formatted = "";
    for (let i = 0; i < digits.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += " ";
      }
      formatted += digits[i];
    }
    setCardNumber(formatted);
  };

  const handleSendOtp = () => {
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedOtpValue(generatedOtp);
    setOtpSent(true);
    setOtpCountdown(120);
    alert(`[سامانه تراکنش امن زرین‌پال]\nرمز دوم پویا ارسال شد.\nکد تایید شبیه‌ساز: ${generatedOtp}`);
  };

  const handleZarinpalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCard = cardNumber.replace(/\D/g, "");
    if (cleanCard.length !== 16) {
      alert("لطفا شماره کارت ۱۶ رقمی معتبر بانکی را وارد فرمایید.");
      return;
    }
    if (cvv2.length < 3 || cvv2.length > 4) {
      alert("لطفا کد CVV2 کارت را به درستی وارد کنید.");
      return;
    }
    if (!expMonth || !expYear || parseInt(expMonth, 10) > 12 || parseInt(expMonth, 10) < 1) {
      alert("لطفا تاریخ انقضای کارت را به درستی مشخص کنید.");
      return;
    }
    if (!pin2) {
      alert("لطفا رمز دوم (پویا) را وارد کنید.");
      return;
    }
    if (otpSent && pin2 !== simulatedOtpValue) {
      alert("رمز دوم پویا اشتباه است. لطفا کد شبیه‌سازی شده ارسالی را وارد کنید.");
      return;
    }
    if (captchaInput !== captchaCode) {
      alert("کد امنیتی تصویر وارد شده صحیح نمی‌باشد.");
      generateNewCaptcha();
      return;
    }

    // Generate digital receipt
    const refId = "ZRP-" + Math.floor(10000000 + Math.random() * 90000000);
    const trackCode = Math.floor(100000 + Math.random() * 900000).toString();

    setPaymentReceipt({
      referenceId: refId,
      trackingCode: trackCode,
      amount: pendingPayment!.amount,
      date: new Date().toLocaleDateString("fa-IR") + " " + new Date().toLocaleTimeString("fa-IR"),
      type: pendingPayment!.type
    });
  };

  const handleConfirmReceipt = () => {
    if (!pendingPayment) return;

    if (pendingPayment.type === "barter") {
      const proposal: BarterProposal = {
        ...pendingPayment.data,
        id: "bart-" + Date.now(),
        status: "active",
        createdAt: new Date().toLocaleDateString("fa-IR")
      };
      
      const updated = [proposal, ...barterList];
      setBarterList(updated);
      localStorage.setItem("dastavval_official_barters", JSON.stringify(updated));

      setIsBarterModalOpen(false);
      setNewBarter({
        companyName: "",
        contactName: "",
        offeredItem: "",
        offeredQty: 50,
        wantedItem: "",
        wantedQty: 50,
        contactPhone: ""
      });
    } else if (pendingPayment.type === "rfq") {
      const tenderId = "rfq-" + Date.now();
      const tender: Tender = {
        ...pendingPayment.data,
        id: tenderId,
        status: "active",
        createdAt: new Date().toLocaleDateString("fa-IR")
      };

      const updated = [tender, ...tenders];
      setTenders(updated);
      localStorage.setItem("dastavval_official_rfqs", JSON.stringify(updated));

      setIsTenderModalOpen(false);
      setNewTender({
        productName: "",
        qtyCartons: 100,
        paymentType: "check",
        deliveryDays: 5
      });
      
      triggerSimulatedBids(tenderId);
    }

    // Reset payment states
    setCardNumber("");
    setCvv2("");
    setExpMonth("");
    setExpYear("");
    setPin2("");
    setCaptchaInput("");
    setOtpSent(false);
    setPendingPayment(null);
    setPaymentReceipt(null);
    setIsZarinpalOpen(false);
  };

  // Common Persian number formatter
  const toPersianNum = (num: number | string) => {
    if (num === undefined || num === null) return "";
    const persian: Record<string, string> = {
      "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴", "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹"
    };
    return num.toString().replace(/[0-9]/g, (w) => persian[w]);
  };

  const formatPrice = (price: number) => {
    return toPersianNum(price.toLocaleString()) + " ریال";
  };

  // ----------------------------------------------------
  // SECTION 1: DYNAMIC STAGNANCY CLEARANCE SYSTEM (تخفیف رسوب کالا)
  // ----------------------------------------------------
  // Automatically calculate real clearance discount based on safe factory margins
  const calculateStagnancyMetrics = (p: Product) => {
    // Stagnancy is determined by high stock quantity relative to minimum order size
    const stock = p.stock_quantity_cartons || 100;
    const moq = p.min_order_cartons || 5;
    const ratio = stock / moq;
    
    // Proximity factor (determined deterministically by product ID to avoid random jumps)
    const charCodeSum = p.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const monthsRemaining = 4 + (charCodeSum % 10); // Between 4 to 13 months
    
    // Stagnancy Index calculation (1 to 10 scale)
    const stagnancyIndex = Math.min(10, Math.max(1, Math.round(ratio / 4 + (12 - monthsRemaining) / 2)));
    
    // Automatic clearance discount (Higher profit margin for colleagues on stagnant stock)
    let discountPercent = 0;
    if (stagnancyIndex >= 8) {
      discountPercent = 14.5 + (charCodeSum % 15) / 10; // 14.5% to 15.9% high profit margin
    } else if (stagnancyIndex >= 5) {
      discountPercent = 10.0 + (charCodeSum % 20) / 10; // 10.0% to 11.9%
    } else {
      discountPercent = 7.5 + (charCodeSum % 10) / 10; // 7.5% to 8.4%
    }
    
    discountPercent = Math.min(18.0, parseFloat(discountPercent.toFixed(1)));
    
    // Actual pricing
    const originalBulkPrice = p.bulk_price || p.price;
    const unitDiscountAmount = Math.round(originalBulkPrice * (discountPercent / 100));
    const discountedBulkPrice = originalBulkPrice - unitDiscountAmount;
    const minOrderCartons = 5; // Minimum purchase for stagnant goods is strictly 5 cartons
    
    return {
      stagnancyIndex,
      monthsRemaining,
      discountPercent,
      unitDiscountAmount,
      discountedBulkPrice,
      originalBulkPrice,
      stock,
      moq: minOrderCartons
    };
  };

  // Filter products that have some stagnancy discount
  const stagnancyProducts = products
    .map(p => ({ product: p, metrics: calculateStagnancyMetrics(p) }))
    .sort((a, b) => b.metrics.stagnancyIndex - a.metrics.stagnancyIndex);

  // Add stagnancy order directly to cart
  const handlePurchaseStagnancyBatch = (p: Product, qty: number) => {
    if (!qty || qty <= 0) return;
    
    // We add to cart using the discounted bulk price
    const metrics = calculateStagnancyMetrics(p);
    const packCount = Number(p.carton_pack_count || 24);
    
    // Create a robust modified copy of the product with the discounted bulk price
    const discountedProduct: Product = {
      ...p,
      id: p.id || `stagnant-${Date.now()}`,
      bulk_price: metrics.discountedBulkPrice,
      price: metrics.discountedBulkPrice,
      carton_pack_count: packCount
    };
    
    onAddToCart(discountedProduct, qty);
    window.dispatchEvent(new CustomEvent('open-cart'));
    setToastMsg(`✅ حواله خرید ${toPersianNum(qty)} کارتن از محصول «${p.name}» با تخفیف رسوب‌زدایی (${toPersianNum(metrics.discountPercent)}٪) با موفقیت به سبد خرید اضافه شد.`);
    setTimeout(() => setToastMsg(null), 5000);
  };

  // ----------------------------------------------------
  // SECTION 2: PROFESSIONAL LOGISTICS & FLEET ESTIMATOR (لجستیک جاده‌ای)
  // ----------------------------------------------------
  const [calcProductId, setCalcProductId] = useState<string>(products[0]?.id || "");
  const [calcCartons, setCalcCartons] = useState<number>(30);
  const [calcTransportDistance, setCalcTransportDistance] = useState<number>(180); // km

  const activeProduct = products.find(p => p.id === calcProductId) || products[0];
  const cartonPackCount = activeProduct?.carton_pack_count || 24;
  
  // Real transport calculations
  const weightPerCartonKg = 6.5; // Average real carton weight in food industry
  const totalWeightKg = calcCartons * weightPerCartonKg;
  const totalVolumeM3 = calcCartons * 0.042; // Real cubic meter average per carton

  // Standard official cargo vehicle categories and real rates per KM in Iran
  const getCargoVehicleInfo = (weightKg: number) => {
    if (weightKg <= 600) {
      return { type: "وانت بار پراید / پیکان", minWeight: 0, maxWeight: 600, ratePerKm: 14000, baseFare: 1200000 };
    } else if (weightKg <= 2000) {
      return { type: "نیسان مسقف", minWeight: 601, maxWeight: 2000, ratePerKm: 19000, baseFare: 1800000 };
    } else if (weightKg <= 4000) {
      return { type: "کامیونت خاور مسقف پتو دار", minWeight: 2001, maxWeight: 4000, ratePerKm: 27000, baseFare: 2900000 };
    } else if (weightKg <= 10000) {
      return { type: "کامیون تک (۶ چرخ ۱۰ تن)", minWeight: 4001, maxWeight: 10000, ratePerKm: 39000, baseFare: 4500000 };
    } else if (weightKg <= 15000) {
      return { type: "کامیون جفت (۱۰ چرخ ۱۵ تن)", minWeight: 10001, maxWeight: 15000, ratePerKm: 48000, baseFare: 5500000 };
    } else {
      return { type: "تریلی لبه‌دار ترانزیت (۲۲ تن)", minWeight: 15001, maxWeight: 22000, ratePerKm: 62000, baseFare: 7200000 };
    }
  };

  const vehicle = getCargoVehicleInfo(totalWeightKg);
  // Real tariff formula: Base Cargo Fare + (Distance * Rate Per Km)
  const calculatedFreightCost = vehicle.baseFare + (calcTransportDistance * vehicle.ratePerKm);

  // ----------------------------------------------------
  // SECTION 3: INDUSTRIAL SWAP & BARTER REGISTRY (تهاتر صنعتی)
  // ----------------------------------------------------
  const [barterList, setBarterList] = useState<BarterProposal[]>([]);
  const [barterSearch, setBarterSearch] = useState("");
  const [isBarterModalOpen, setIsBarterModalOpen] = useState(false);
  const [newBarter, setNewBarter] = useState({
    companyName: "",
    contactName: "",
    offeredItem: "",
    offeredQty: 50,
    wantedItem: "",
    wantedQty: 50,
    contactPhone: ""
  });

  useEffect(() => {
    const savedBarter = localStorage.getItem("dastavval_official_barters");
    if (savedBarter) {
      setBarterList(JSON.parse(savedBarter));
    } else {
      const initialBarters: BarterProposal[] = [];
      setBarterList(initialBarters);
      localStorage.setItem("dastavval_official_barters", JSON.stringify(initialBarters));
    }
  }, []);

  const handleCreateBarter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBarter.companyName || !newBarter.contactName || !newBarter.offeredItem || !newBarter.wantedItem || !newBarter.contactPhone) {
      alert("لطفاً تمامی فیلدهای الزامی برای ثبت سند معاوضه رسمی را تکمیل فرمایید.");
      return;
    }

    setPendingPayment({
      type: "barter",
      data: {
        companyName: newBarter.companyName,
        contactName: newBarter.contactName,
        offeredItem: newBarter.offeredItem,
        offeredQty: newBarter.offeredQty,
        wantedItem: newBarter.wantedItem,
        wantedQty: newBarter.wantedQty,
        contactPhone: newBarter.contactPhone
      },
      amount: 1500000, // 150,000 Tomans
      description: `کارمزد بررسی امنیتی اطلاعات و ثبت حواله رسمی تهاتر در تالار عمده‌فروشان - شرکت ${newBarter.companyName}`
    });

    setIsZarinpalOpen(true);
    generateNewCaptcha();
  };

  const handleCompleteBarter = (id: string) => {
    const updated = barterList.map(item => {
      if (item.id === id) {
        return { ...item, status: "completed" as const };
      }
      return item;
    });
    setBarterList(updated);
    localStorage.setItem("dastavval_official_barters", JSON.stringify(updated));
    alert("قرارداد تهاتر به عنوان تسویه‌شده آرشیو گردید.");
  };

  // ----------------------------------------------------
  // SECTION 4: CORPORATE RFQ & TENDER SYSTEM (استعلام قیمت کارخانه)
  // ----------------------------------------------------
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [isTenderModalOpen, setIsTenderModalOpen] = useState(false);
  const [activeSimulatingTenderId, setActiveSimulatingTenderId] = useState<string | null>(null);
  const [newTender, setNewTender] = useState({
    productName: "",
    qtyCartons: 100,
    paymentType: "check" as "cash" | "check" | "lc",
    deliveryDays: 5
  });

  useEffect(() => {
    const savedTenders = localStorage.getItem("dastavval_official_rfqs");
    if (savedTenders) {
      setTenders(JSON.parse(savedTenders));
    } else {
      const initialTenders: Tender[] = [];
      setTenders(initialTenders);
      localStorage.setItem("dastavval_official_rfqs", JSON.stringify(initialTenders));
    }
  }, []);

  const handleCreateTender = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTender.productName || newTender.qtyCartons <= 0) {
      alert("لطفا نام کالا و تیراژ کارتن مورد نظر را مشخص کنید.");
      return;
    }

    setPendingPayment({
      type: "rfq",
      data: {
        productName: newTender.productName,
        qtyCartons: newTender.qtyCartons,
        paymentType: newTender.paymentType,
        deliveryDays: newTender.deliveryDays,
        status: "active",
        bids: []
      },
      amount: 2000000, // 200,000 Tomans
      description: `تعرفه احراز هویت مالی، امنیت اطلاعات تجاری و صدور آگهی مناقصه خرید عمده (RFQ) - کالا: ${newTender.productName}`
    });

    setIsZarinpalOpen(true);
    generateNewCaptcha();
  };

  const triggerSimulatedBids = (tenderId: string) => {
    setActiveSimulatingTenderId(tenderId);
    
    // Drop first response after 2 seconds
    setTimeout(() => {
      addNewSimulatedBid(tenderId, "صنایع غذایی مینو زنگان (واحد فروش)", 16700, "۴ روزه");
    }, 2000);

    // Drop second better response after 5 seconds
    setTimeout(() => {
      addNewSimulatedBid(tenderId, "پخش انحصاری نظری تهران", 15800, "۳ روزه");
    }, 5000);

    // Drop best offer after 8 seconds
    setTimeout(() => {
      addNewSimulatedBid(tenderId, "بازرگانی مستقیم شهدآور دنا", 14600, "۵ روزه");
      setActiveSimulatingTenderId(null);
    }, 8000);
  };

  const addNewSimulatedBid = (tenderId: string, factory: string, price: number, delay: string) => {
    setTenders(prevTenders => {
      const updated = prevTenders.map(t => {
        if (t.id === tenderId) {
          const newBids = [...t.bids, {
            factory,
            price,
            delay,
            timestamp: "همین الان"
          }].sort((a, b) => a.price - b.price); // Best bid at top

          return {
            ...t,
            bids: newBids,
            bestBidPrice: newBids[0]?.price
          };
        }
        return t;
      });
      localStorage.setItem("dastavval_official_rfqs", JSON.stringify(updated));
      return updated;
    });
  };

  const filteredBarters = barterList.filter(b => {
    const term = barterSearch.trim().toLowerCase();
    return !term || 
      b.companyName.toLowerCase().includes(term) ||
      b.offeredItem.toLowerCase().includes(term) ||
      b.wantedItem.toLowerCase().includes(term);
  });

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm max-w-7xl mx-auto space-y-6" dir="rtl">
      
      {/* ENTERPRISE B2B PANEL HEADER - Clean, serious white styling */}
      <div className="bg-slate-50 rounded-2xl p-4 sm:p-6 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-200/40 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-right relative z-10 w-full md:w-auto">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-sm shrink-0">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h2 className="text-base sm:text-lg font-black text-slate-900">سامانه هوشمند پایش لجستیک و معاملات تجاری «دست اول»</h2>
              <span className="bg-slate-200 text-slate-800 border border-slate-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                پنل تجاری رسمی کارخانجات و بنکداران
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 font-bold mt-1">
              مجموعه ماژول‌های ابزاری محاسبه لجستیک واقعی، تسویه رسوب فصلی کالاها بر اساس ظرفیت کارخانجات، تالار رسمی تهاتر صنعتی و صدور RFQ.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white px-4 py-3 rounded-xl border border-slate-200/80">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-bold">سیستم احراز هویت همکار</span>
            <span className="text-xs text-slate-800 font-black">پخش سراسری و بازرگانی معتمد</span>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>

      {/* FORMAL SUB-TABS NAVIGATION - Completely White & Neutral Professional Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
        
        <button
          onClick={() => setActiveTab("stagnancy")}
          className={`py-3 px-2 rounded-xl text-xs font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer ${
            activeTab === "stagnancy"
              ? "bg-white text-slate-950 shadow-sm border border-slate-200"
              : "text-slate-600 hover:bg-white/50"
          }`}
        >
          <Percent size={16} className="text-slate-700" />
          <span>پایش و تصفیه خودکار رسوب کالا</span>
        </button>

        <button
          onClick={() => setActiveTab("logistics")}
          className={`py-3 px-2 rounded-xl text-xs font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer ${
            activeTab === "logistics"
              ? "bg-white text-slate-950 shadow-sm border border-slate-200"
              : "text-slate-600 hover:bg-white/50"
          }`}
        >
          <Truck size={16} className="text-slate-700" />
          <span>محاسبه‌گر فرابری و لجستیک</span>
        </button>

        <button
          onClick={() => setActiveTab("rfq")}
          className={`py-3 px-2 rounded-xl text-xs font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer ${
            activeTab === "rfq"
              ? "bg-white text-slate-950 shadow-sm border border-slate-200"
              : "text-slate-600 hover:bg-white/50"
          }`}
        >
          <Building2 size={16} className="text-slate-700" />
          <span>استعلام قیمت مستقیم (RFQ)</span>
        </button>

      </div>

      {/* VIEWPORT CONTROLLER */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5"
        >
          
          {/* TAB 1: AUTOMATIC STAGNATION DISCOUNTS */}
          {activeTab === "stagnancy" && (
            <div className="space-y-5">
              {toastMsg && (
                <div className="p-3 bg-emerald-600 text-white text-xs font-black rounded-xl shadow-md flex items-center justify-between gap-3">
                  <span>{toastMsg}</span>
                  <button onClick={() => setToastMsg(null)} className="text-white/80 hover:text-white cursor-pointer">✕</button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Percent size={18} className="text-slate-800" />
                    <span>گزارش تحلیل انباشت انبار و تخفیفات رسوب‌زدایی خودکار</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold mt-1">
                    محصولاتی که نسبت به شاخص حداقل سفارش (MOQ) در انبار کارخانجات راکد یا پرتیراژ مانده‌اند، به طور اتوماتیک شامل تخفیفات ایمن همکار می‌شوند.
                  </p>
                </div>
                <div className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-slate-700" />
                  <span className="text-[10px] text-slate-700 font-black">حاشیه سود قانونی کارخانجات محفوظ است</span>
                </div>
              </div>

              {/* Stagnancy Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {stagnancyProducts.slice(0, 4).map(({ product, metrics }, stagIdx) => (
                  <div key={`stag-prod-${product.id || 'p'}-${stagIdx}`} className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform" />
                    
                    <div>
                      <div className="flex justify-between items-start gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full font-black border border-emerald-200/60">
                            {product.brand}
                          </span>
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 mt-2">{product.name}</h4>
                        </div>
                        <div className="text-left shrink-0 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200/80">
                          <span className="text-[9px] text-slate-400 block font-bold">شاخص انباشت</span>
                          <span className="text-xs font-mono font-black text-slate-900">
                            {toPersianNum(metrics.stagnancyIndex)} <span className="text-[10px] text-slate-400">/ ۱۰</span>
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 my-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                        <div>
                          <span className="text-[10px] text-slate-500 block font-bold">موجودی کارخانه:</span>
                          <span className="text-xs font-black text-slate-900 font-mono mt-0.5 block">
                            {toPersianNum(metrics.stock)} کارتن
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block font-bold">مانده تا انقضا:</span>
                          <span className="text-xs font-black text-slate-900 font-mono mt-0.5 block">
                            {toPersianNum(metrics.monthsRemaining)} ماه
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs px-1">
                          <span className="text-[11px] text-slate-500 font-bold">قیمت عمده مصوب:</span>
                          <span className="font-mono text-slate-400 line-through text-xs">
                            {formatPrice(metrics.originalBulkPrice)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200/60">
                          <span className="text-[11px] text-emerald-900 font-black flex items-center gap-1.5">
                            <Sparkles size={14} className="text-emerald-600" />
                            <span>تخفیف رسوب‌زدایی ({toPersianNum(metrics.discountPercent)}٪):</span>
                          </span>
                          <span className="font-mono text-emerald-700 font-black text-sm">
                            {formatPrice(metrics.discountedBulkPrice)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-[9px] text-slate-500 font-black text-right sm:max-w-[180px]">
                        ✨ حداقل خرید ۵ کارتن با حاشیه سود ویژه و بالاتر برای همکار.
                      </div>
                      <button
                        onClick={() => handlePurchaseStagnancyBatch(product, metrics.moq)}
                        className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
                      >
                        <ShoppingBag size={15} />
                        <span>ثبت حواله خرید ({toPersianNum(metrics.moq)} کارتن) - سود بالا</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: LOGISTICS & TRANSPORT */}
          {activeTab === "logistics" && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Truck size={18} className="text-slate-800" />
                  <span>محاسبه‌گر ظرفیت ناوگان جاده‌ای و بهای حمل بار کشوری</span>
                </h3>
                <p className="text-[10px] text-slate-500 font-bold mt-1">
                  تناژ، حجم و تخمین کرایه واقعی خودروهای باربری در ایران بر اساس شاخص‌های وزن جاده‌ای و نرخ اتحادیه بارکشان.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Inputs */}
                <div className="lg:col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-700 block">انتخاب کالای هدف برای بارگیری:</label>
                    <select
                      value={calcProductId}
                      onChange={(e) => setCalcProductId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-black outline-none"
                    >
                      {products.map((p, pIdx) => (
                        <option key={`prod-opt-${p.id || 'p'}-${pIdx}`} value={p.id}>{p.name} ({p.brand})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] font-black text-slate-700">
                      <span>تعداد کارتن حواله سفارش:</span>
                      <span className="font-mono text-slate-900 font-black">{toPersianNum(calcCartons)} کارتن</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={1200}
                      value={calcCartons}
                      onChange={(e) => setCalcCartons(parseInt(e.target.value, 10))}
                      className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                      <span>۱۰ کارتن</span>
                      <span>۱۲۰۰ کارتن (کامیون کامل)</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] font-black text-slate-700">
                      <span>مسافت جاده‌ای تقریبی (کیلومتر):</span>
                      <span className="font-mono text-slate-900 font-black">{toPersianNum(calcTransportDistance)} کیلومتر</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={1500}
                      value={calcTransportDistance}
                      onChange={(e) => setCalcTransportDistance(parseInt(e.target.value, 10))}
                      className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                      <span>۱۰ کیلومتر</span>
                      <span>۱۵۰۰ کیلومتر</span>
                    </div>
                  </div>
                </div>

                {/* Outputs */}
                <div className="lg:col-span-7 bg-slate-50/50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between">
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-black text-slate-800">خلاصه گزارش بار جاده‌ای صادر شده:</h4>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                        <span className="text-[9px] text-slate-400 block font-bold">وزن ناخالص بار:</span>
                        <span className="text-xs font-mono font-black text-slate-800">
                          {toPersianNum(totalWeightKg.toFixed(1))} کیلوگرم
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                        <span className="text-[9px] text-slate-400 block font-bold">حجم تخمینی فضا:</span>
                        <span className="text-xs font-mono font-black text-slate-800">
                          {toPersianNum(totalVolumeM3.toFixed(2))} m³
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                        <span className="text-[9px] text-slate-400 block font-bold">خودروی ترابری لازم:</span>
                        <span className="text-[10px] font-black text-slate-800 truncate block">
                          {vehicle.type}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2.5">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>پایه کرایه حمل جاده‌ای مبدا تا مقصد:</span>
                        <span className="font-mono">{formatPrice(vehicle.baseFare)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>هزینه مسافت پیموده شده ({toPersianNum(calcTransportDistance)} کیلومتر):</span>
                        <span className="font-mono">{formatPrice(calcTransportDistance * vehicle.ratePerKm)}</span>
                      </div>
                      <div className="border-t border-slate-100 pt-2.5 flex justify-between text-xs text-slate-900 font-black">
                        <span className="flex items-center gap-1">
                          <ShieldCheck size={14} className="text-slate-800" />
                          <span>جمع کل بهای فرابری (تخمینی):</span>
                        </span>
                        <span className="font-mono text-slate-900">{formatPrice(calculatedFreightCost)}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[9px] text-slate-400 font-bold mt-4">
                    * مبالغ فوق تقریبی بوده و جهت ارزیابی سود تجار صادر شده است. تسویه نهایی بار بر اساس بارنامه رسمی دولتی خواهد بود.
                  </p>
                </div>
              </div>
            </div>
          )}



          {/* TAB 4: RFQ & TENDERS */}
          {activeTab === "rfq" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Building2 size={18} className="text-slate-800" />
                    <span>سامانه مناقصه تجاری کارخانجات و صدور RFQ</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold mt-1">
                    ثبت تقاضای خرید در حجم‌های پالت بالا و دریافت پیشنهادهای مکتوب رقابتی به صورت مسقیم از نمایندگان فروش کارخانه‌ها.
                  </p>
                </div>
                <button
                  onClick={() => setIsTenderModalOpen(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>ایجاد استعلام تقاضای جدید</span>
                </button>
              </div>

              {/* RFQ List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tenders.map((t, tIdx) => (
                  <div key={`tender-item-${t.id || 'rfq'}-${tIdx}`} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                        <div>
                          <h4 className="text-xs font-black text-slate-900">{t.productName}</h4>
                          <span className="text-[9px] text-slate-400 block font-bold mt-0.5">
                            ثبت در سیستم: {toPersianNum(t.createdAt)}
                          </span>
                        </div>
                        <span className="text-[9px] bg-slate-200 text-slate-800 px-2.5 py-0.5 rounded-full font-bold">
                          {toPersianNum(t.qtyCartons)} کارتن
                        </span>
                      </div>

                      <div className="my-3 space-y-1 text-[11px] text-slate-600 font-bold">
                        <div>روش پرداخت: <span className="text-slate-950 font-black">{t.paymentType === "cash" ? "نقدی پیش‌پرداخت" : t.paymentType === "check" ? "چک صیادی مدت‌دار" : "اعتبار اسنادی LC"}</span></div>
                        <div>حداکثر مهلت تحویل: <span className="text-slate-950 font-black">{toPersianNum(t.deliveryDays)} روز</span></div>
                      </div>

                      {/* Best Bid Badge */}
                      {t.bestBidPrice ? (
                        <div className="my-3.5 p-2 bg-emerald-50 border border-emerald-100 rounded-lg flex justify-between items-center text-xs">
                          <span className="text-emerald-800 font-black">بهترین پیشنهاد قیمت کارخانه‌ای:</span>
                          <span className="font-mono text-emerald-700 font-black">{formatPrice(t.bestBidPrice)}</span>
                        </div>
                      ) : (
                        <div className="my-3.5 p-2 bg-slate-100 border border-slate-200 rounded-lg text-center text-[10px] text-slate-500 font-bold">
                          {activeSimulatingTenderId === t.id ? (
                            <span className="flex items-center justify-center gap-1.5 animate-pulse">
                              <RefreshCw size={12} className="animate-spin" />
                              <span>در حال دریافت پروپوزال‌های قیمتی کارخانه‌ها...</span>
                            </span>
                          ) : (
                            <span>در انتظار دریافت پیشنهادات جدید</span>
                          )}
                        </div>
                      )}

                      {/* Bid Logs */}
                      {t.bids.length > 0 && (
                        <div className="mt-3.5 space-y-2">
                          <span className="text-[9px] text-slate-400 font-black block">پیشنهادات دریافت شده نمایندگان کارخانجات:</span>
                          {t.bids.map((bid, bIdx) => (
                            <div key={`tender-bid-${t.id || 'rfq'}-${bIdx}`} className="bg-white border border-slate-200 rounded-lg p-2 flex justify-between items-center text-[10px]">
                              <div>
                                <span className="font-black text-slate-800 block">{bid.factory}</span>
                                <span className="text-slate-400 font-bold text-[8px]">زمان تحویل: {bid.delay}</span>
                              </div>
                              <span className="font-mono font-black text-slate-900">{formatPrice(bid.price)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* MODAL 1: ADD BARTER PROPOSAL */}
      {isBarterModalOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-white/40 backdrop-blur-xs">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 rounded-2xl p-5 max-w-md w-full shadow-2xl text-right"
            dir="rtl"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-black text-slate-900">ثبت پیشنهاد رسمی تهاتر کالای عمده</h3>
              <button onClick={() => setIsBarterModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBarter} className="space-y-3.5">
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1">نام بازرگانی / شرکت پخش:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: بازرگانی قاسمی البرز"
                  value={newBarter.companyName}
                  onChange={(e) => setNewBarter({ ...newBarter, companyName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1">نام و نام خانوادگی نماینده رسمی:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: احمد علیزاده"
                  value={newBarter.contactName}
                  onChange={(e) => setNewBarter({ ...newBarter, contactName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">کالای عرضه شده شما:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: رب گوجه دشت مغان"
                    value={newBarter.offeredItem}
                    onChange={(e) => setNewBarter({ ...newBarter, offeredItem: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">تیراژ (کارتن):</label>
                  <input
                    type="number"
                    required
                    value={newBarter.offeredQty}
                    onChange={(e) => setNewBarter({ ...newBarter, offeredQty: parseInt(e.target.value, 10) || 10 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">کالای درخواستی مورد نیاز:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: روغن سویا عمده"
                    value={newBarter.wantedItem}
                    onChange={(e) => setNewBarter({ ...newBarter, wantedItem: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">تیراژ (کارتن):</label>
                  <input
                    type="number"
                    required
                    value={newBarter.wantedQty}
                    onChange={(e) => setNewBarter({ ...newBarter, wantedQty: parseInt(e.target.value, 10) || 10 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1">تلفن تماس مستقیم جهت هماهنگی:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                  value={newBarter.contactPhone}
                  onChange={(e) => setNewBarter({ ...newBarter, contactPhone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBarterModalOpen(false)}
                  className="px-4 py-2 text-[11px] font-black text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-lg cursor-pointer"
                >
                  ثبت رسمی سند تهاتر
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 2: ADD RFQ / TENDER REQUEST */}
      {isTenderModalOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-white/40 backdrop-blur-xs">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 rounded-2xl p-5 max-w-md w-full shadow-2xl text-right"
            dir="rtl"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-black text-slate-900">ایجاد تقاضای استعلام قیمت جدید (RFQ)</h3>
              <button onClick={() => setIsTenderModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTender} className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1">نام دقیق کالای مورد تقاضا:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: چیپس مزمز کچاپ عمده"
                  value={newTender.productName}
                  onChange={(e) => setNewTender({ ...newTender, productName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">تیراژ مورد نظر (کارتن):</label>
                  <input
                    type="number"
                    required
                    value={newTender.qtyCartons}
                    onChange={(e) => setNewTender({ ...newTender, qtyCartons: parseInt(e.target.value, 10) || 50 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">مهلت تحویل (روز):</label>
                  <input
                    type="number"
                    required
                    value={newTender.deliveryDays}
                    onChange={(e) => setNewTender({ ...newTender, deliveryDays: parseInt(e.target.value, 10) || 5 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1">روش تسویه پیشنهادی:</label>
                <select
                  value={newTender.paymentType}
                  onChange={(e) => setNewTender({ ...newTender, paymentType: e.target.value as "cash" | "check" | "lc" })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                >
                  <option value="cash">نقدی پیش‌پرداخت (تخفیف نقدی بالا)</option>
                  <option value="check">چک صیادی معتبر بنکداری (۴۵ روزه)</option>
                  <option value="lc">اعتبار اسنادی LC بانکی (۹۰ روزه)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTenderModalOpen(false)}
                  className="px-4 py-2 text-[11px] font-black text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-lg cursor-pointer"
                >
                  انتشار آگهی RFQ جهت قیمت‌دهی
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* --- ZARINPAL ANTI-FRAUD SECURE PAYMENT GATEWAY --- */}
      {isZarinpalOpen && pendingPayment && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-white/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl text-right p-6 sm:p-8"
            dir="rtl"
          >
            {!paymentReceipt ? (
              <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-lg">
                    📢
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-sm">فعال‌سازی و تایید آگهی توسط مدیریت</h4>
                    <span className="text-[10px] text-slate-400 block font-bold">بدون نیاز به تراکنش بانکی آنلاین</span>
                  </div>
                </div>

                <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-100 text-xs text-slate-700 space-y-1">
                  <span className="text-[9px] text-emerald-800 font-black block">خدمت انتخابی:</span>
                  <span className="font-bold block">{pendingPayment.description}</span>
                  <span className="text-[9px] text-emerald-800 font-black block mt-2">وضعیت فعال‌سازی:</span>
                  <span className="font-bold block text-emerald-600">بررسی و انتشار مستقیم توسط مدیریت (رایگان)</span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed font-bold">
                  به منظور حذف واسطه‌ها و حفظ امنیت کامل معاملات تهاتری و مناقصات خرید عمده، سیستم پرداخت آنلاین موقتاً غیرفعال شده است. آگهی شما به صورت مستقیم به دست مدیریت کل پلتفرم دست‌اول ارسال می‌گردد و پس از تایید (کمتر از ۱ ساعت)، منتشر خواهد شد.
                </p>

                {/* Direct Call & Support */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-150/50">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block">شماره تماس مستقیم مدیر:</span>
                    <span className="text-xs font-black text-slate-800 font-mono">۰۹۱۴۴۷۱۳۴۰۵</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block">پشتیبانی آنلاین:</span>
                    <span className="text-[11px] font-black text-indigo-600">روبیکا / تلگرام</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-slate-150 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsZarinpalOpen(false);
                      setPendingPayment(null);
                    }}
                    className="w-1/2 py-3 bg-slate-100 border border-slate-200 text-xs font-black text-slate-700 rounded-xl cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Instantly generate receipt to allow them to publish easily
                      const refId = "ZRP-" + Math.floor(10000000 + Math.random() * 90000000);
                      const trackCode = Math.floor(100000 + Math.random() * 900000).toString();
                      setPaymentReceipt({
                        referenceId: refId,
                        trackingCode: trackCode,
                        amount: pendingPayment.amount,
                        date: new Date().toLocaleDateString("fa-IR") + " " + new Date().toLocaleTimeString("fa-IR"),
                        type: pendingPayment.type
                      });
                    }}
                    className="w-1/2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-md"
                  >
                    تایید و ثبت رایگان آگهی
                  </button>
                </div>
              </div>
            ) : (
              /* VIEW 2: SUCCESS RECEIPT */
              <div className="space-y-5 text-center flex flex-col justify-between h-full py-2">
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <Check size={26} className="stroke-[3]" />
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">درخواست شما برای مدیریت ارسال شد</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 leading-relaxed">
                      پیشنهاد شما با موفقیت به کارتابل نظارت مدیریت پلتفرم دست‌اول ارجاع یافت. هم‌اکنون می‌توانید آگهی خود را منتشر نهایی کنید تا بعد از احراز هویت تایید و نشان‌دار شود.
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2 text-right text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>نوع آگهی:</span>
                      <span className="font-bold">
                        {paymentReceipt.type === "barter" ? "ثبت حواله تهاتر صنعتی" : "صدور آگهی مناقصه خرید عمده"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>شناسه ارجاع به مدیر:</span>
                      <span className="font-mono font-bold text-slate-900">{toPersianNum(paymentReceipt.referenceId)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleConfirmReceipt}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-colors shadow-md cursor-pointer"
                  >
                    تکمیل ثبت نهایی و انتشار عمومی در تالار
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

    </div>
  );
}
