import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../lib/firebase";
import { collection, addDoc } from "../lib/firebase-mock";
import { 
  Plus, 
  Sparkles, 
  Building2, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  Eye, 
  FileText, 
  Search, 
  ShieldCheck, 
  Megaphone, 
  ArrowLeftRight, 
  ChevronLeft, 
  Info, 
  X, 
  ArrowUpRight, 
  Upload,
  AlertTriangle,
  BadgePercent,
  TrendingDown,
  Lock,
  Check,
  UserCheck,
  ShieldAlert,
  ChevronDown,
  LockKeyhole,
  Boxes,
  UploadCloud,
  Briefcase,
  Wrench,
  Trash2,
  Camera
} from "lucide-react";

export interface AdItem {
  id: string;
  title: string;
  description: string;
  factoryName: string;
  contactPerson: string;
  contactPhone: string; // Admin eyes only - proxied securely
  badgeText: string;
  category: "under_market" | "liquid" | "direct_supply" | "raw_material" | "service";
  quantity: string;
  wholesalePrice: string; // قیمت عمده پیشنهادی
  marketPrice: string;    // قیمت مصرف کننده یا بازار آزاد
  buyerProfit: string;    // سود تخمینی خریدار (اختلاف قیمت)
  isSponsored?: boolean;
  date: string;
  imageUrl?: string;
  imageUrls?: string[];   // Support multiple image uploads
  status: "approved" | "pending" | "rejected";
  rejectionReason?: string;
  specialRequest?: boolean;
  specialRequestMessage?: string;
}

export const getAdFallbackImage = (title: string, category: string): string => {
  const norm = title.toLowerCase();
  if (category === "service") {
    if (norm.includes("حساب") || norm.includes("مالی")) {
      return "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=400";
    }
    if (norm.includes("طراحی") || norm.includes("بسته‌بندی") || norm.includes("برند")) {
      return "https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&q=80&w=400";
    }
    return "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=400";
  }
  if (norm.includes("روغن")) {
    return "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400";
  }
  if (norm.includes("شکر") || norm.includes("قند")) {
    return "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&q=80&w=400";
  }
  if (norm.includes("نشاسته") || norm.includes("آرد") || norm.includes("گلوتن")) {
    return "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&q=80&w=400";
  }
  if (norm.includes("رب") || norm.includes("گوجه")) {
    return "https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=400";
  }
  if (norm.includes("نوشمک") || norm.includes("یخی") || norm.includes("شربت")) {
    return "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=400";
  }
  return "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400";
};

interface AdBoardProps {
  onTriggerPayment?: (paymentInfo: {
    amount: number;
    description: string;
    callback: (success: boolean) => void;
  }) => void;
  isMini?: boolean;
  onNavigateToBillboard?: () => void;
}

export default function AdBoard({ onTriggerPayment, isMini = false, onNavigateToBillboard }: AdBoardProps) {
  const [ads, setAds] = useState<AdItem[]>([]);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedAdDetail, setSelectedAdDetail] = useState<AdItem | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<"all" | "under_market" | "liquid" | "direct_supply" | "raw_material" | "service">("all");
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [showRuleOverlay, setShowRuleOverlay] = useState(false);
  const [isIntroExpanded, setIsIntroExpanded] = useState(false);

  // Secure Escrow Interaction Modal State
  const [escrowModalAd, setEscrowModalAd] = useState<AdItem | null>(null);
  const [escrowSuccess, setEscrowSuccess] = useState(false);
  const [escrowLoading, setEscrowLoading] = useState(false);
  const [buyerPhoneInput, setBuyerPhoneInput] = useState("");
  const [buyerMessage, setBuyerMessage] = useState("");

  // Form states (Proxying phone inputs internally and forbidding public publishing)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [factoryName, setFactoryName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState<"under_market" | "liquid" | "direct_supply" | "raw_material" | "service">("raw_material");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [marketPrice, setMarketPrice] = useState("");
  const [buyerProfit, setBuyerProfit] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]); // Multiple image uploads
  const [isSpecialRequested, setIsSpecialRequested] = useState(false);
  const [specialMessage, setSpecialMessage] = useState("تماس فوری جهت تایید پلمپ");
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  
  // Validation Warnings
  const [phoneWarning, setPhoneWarning] = useState("");

  const initialAds: AdItem[] = [
    {
      id: "ad-raw-1",
      title: "روغن جانشین کره کاکائو CBS مالزی مخصوص کارخانجات شکلات",
      description: "بار مستقیم روغن CBS مرغوب مالزی با درجه کیفی درجه یک ایده‌آل برای روکش بستنی، قنادی و صنایع شکلات‌سازی. توزیع با تضمین تایید آنالیز و تسویه امن امانی دست‌اول.",
      factoryName: "مواد اولیه آریا طب",
      contactPerson: "آقای یزدانی",
      contactPhone: "۰۹۱۲۷۷۷۶۶۵۵",
      badgeText: "📦 مواد اولیه صنعتی",
      category: "raw_material",
      quantity: "۲۰ تن",
      wholesalePrice: "۱۴۵,۰۰۰ تومان",
      marketPrice: "۱۶۵,۰۰۰ تومان",
      buyerProfit: "۱۲٪ سود عمده (۲۰,۰۰۰ تومان تخفیف در کیلو)",
      isSponsored: true,
      date: "۱۴۰۵/۰۵/۲۲",
      imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400",
      status: "approved"
    },
    {
      id: "ad-raw-2",
      title: "شکر سفید تصفیه‌شده کارخانه کشت و صنعت دهخدا",
      description: "بسته‌بندی کیسه ۵۰ کیلویی استاندارد با گرید کیفی بسیار بالا و حلالیت فوری، مناسب کارگاه‌ها و کارخانجات صنایع نوشیدنی، شیرینی و قنادی‌ها. تحویل فوری از انبار با تسویه امانی.",
      factoryName: "صنایع غذایی شکرستان خلیج فارس",
      contactPerson: "مهندس احمدی",
      contactPhone: "۰۹۱۶۲۲۲۳۳۴۴",
      badgeText: "📦 مواد اولیه صنعتی",
      category: "raw_material",
      quantity: "۵۰ تن",
      wholesalePrice: "۳۹,۵۰۰ تومان",
      marketPrice: "۴۴,۰۰۰ تومان",
      buyerProfit: "۱۰٪ حاشیه سود (۴,۵۰۰ تومان تخفیف در هر کیلو)",
      isSponsored: true,
      date: "۱۴۰۵/۰۵/۲۱",
      imageUrl: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&q=80&w=400",
      status: "approved"
    },
    {
      id: "ad-1",
      title: "قند شکسته درجه یک ۵ کیلویی مازاد خط تولید (بدون افشای برند)",
      description: "تعداد ۵۰ تن بار مازاد قند کله شکسته درجه یک در بسته‌بندی‌های نایلونی ۵ کیلویی استاندارد با سیب سلامت بدون ذکر برند جهت ممانعت از تنش قیمتی در بازار مصرف.",
      factoryName: "صنایع قند و شکر مرودشت",
      contactPerson: "مهندس رسولی",
      contactPhone: "۰۹۱۲۳۴۵۶۷۸۹",
      badgeText: "📉 زیر قیمت بازار",
      category: "under_market",
      quantity: "۵۰ تن",
      wholesalePrice: "۳۸,۰۰۰ تومان",
      marketPrice: "۵۴,۰۰۰ تومان",
      buyerProfit: "۳۰٪ سود ناخالص (۱۶,۰۰۰ تومان حاشیه سود)",
      isSponsored: true,
      date: "۱۴۰۵/۰۵/۲۲",
      imageUrl: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&q=80&w=400",
      status: "approved"
    },
    {
      id: "ad-2",
      title: "روغن سویا مصارف صنعتی حلب ۱۶ کیلویی استاندارد",
      description: "روغن مایع خوراکی تصفیه شده سویا حلب فلزی ۱۶ کیلویی با فاکتور رسمی مستقیم کارخانه شیراز بدون نام برند انحصاری جهت حفظ ثبات و اعتبار تجاری کارخانه.",
      factoryName: "کشت و صنعت روغن شمال",
      contactPerson: "حاج علی رحیمی",
      contactPhone: "۰۹۱۲۹۹۹۸۸۷۷",
      badgeText: "🔥 حراج مفت بازار",
      category: "liquid",
      quantity: "۱۵ تن",
      wholesalePrice: "۶۲۰,۰۰۰ تومان",
      marketPrice: "۸۴۰,۰۰۰ تومان",
      buyerProfit: "۲۶٪ حاشیه سود واقعی (۲۲۰,۰۰۰ تومان صرفه‌جویی)",
      isSponsored: true,
      date: "۱۴۰۵/۰۵/۲۱",
      imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400",
      status: "approved"
    },
    {
      id: "ad-3",
      title: "رب گوجه فرنگی قوطی ۸۰۰ گرمی صادراتی بریکس ۲۷",
      description: "بار مازاد ۴۰ هزار قوطی رب گوجه فرنگی غلیظ با کیفیت استثنایی و رنگ فوق‌العاده. به منظور حفظ ثبات قیمت بازار، برند کالا محرمانه مانده و تحویل از طریق واسطه امین انجام می‌پذیرد.",
      factoryName: "توسعه صنایع غذایی دشت شیراز",
      contactPerson: "مهندس سلیمانی",
      contactPhone: "۰۹۱۷۳۳۳۴۴۵۵",
      badgeText: "📉 کف قیمت بازار",
      category: "under_market",
      quantity: "۴۰,۰۰۰ قوطی",
      wholesalePrice: "۳۲,۰۰۰ تومان",
      marketPrice: "۴۹,۰۰0 تومان",
      buyerProfit: "۳۵٪ سود تضمینی (۱۷,۰۰۰ تومان اختلاف قیمت)",
      isSponsored: true,
      date: "۱۴۰۵/۰۵/۲۰",
      imageUrl: "https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=400",
      status: "approved"
    },
    {
      id: "ad-4",
      title: "نوشمک میوه‌ای یخی بسته‌بندی بهداشتی ۲ تن بدون درج برند",
      description: "نوشمک یخی در طعم‌های آلبالویی، پرتقالی و طالبی با بسته‌بندی عالی ۲ تنی به قیمت فوق‌العاده رقابتی. مناسب پخش استانی بدون درج عمومی نام تجاری جهت حفاظت از قیمت نمایندگی‌ها.",
      factoryName: "صنایع فرآورده‌های یخی آذربایجان",
      contactPerson: "آقای علیزاده",
      contactPhone: "۰۹۱۴۱۱۱۲۲۳۳",
      badgeText: "📦 تامین مستقیم",
      category: "direct_supply",
      quantity: "۲ تن",
      wholesalePrice: "۲,۵۰۰ تومان",
      marketPrice: "۴,۰۰0 تومان",
      buyerProfit: "۳۷٪ سود خالص بازار (۱,۵۰۰ تومان سود در هر عدد)",
      isSponsored: false,
      date: "۱۴۰۵/۰۵/۱۹",
      imageUrl: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=400",
      status: "approved"
    },
    {
      id: "ad-srv-1",
      title: "خدمات تخصصی ترخیص گمرکی و تخصیص ارز بازرگانی سینا",
      description: "ترخیص فوری انواع مواد اولیه صنعتی، ماشین‌آلات خط تولید و قطعات یدکی از گمرکات بندرعباس، تهران و بازرگان با کمترین تعرفه و بیشترین سرعت مالی و اداری. مشاوره رایگان تلفنی با ضمانت حسن انجام تعهدات دست‌اول.",
      factoryName: "شرکت توسعه بازرگانی سینا تجارت زاگرس",
      contactPerson: "آقای امینی (مشاور گمرکی)",
      contactPhone: "۰۹۱۲۹۹۹۳۳۲۲",
      badgeText: "🛠️ خدمات بازرگانی",
      category: "service",
      quantity: "نامحدود",
      wholesalePrice: "تعرفه مصوب گمرکی",
      marketPrice: "رقابتی و توافقی",
      buyerProfit: "تسهیل فرآیند ترخیص و ارزیابی پرونده",
      isSponsored: true,
      date: "۱۴۰۵/۰۵/۲۲",
      imageUrl: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=400",
      status: "approved"
    },
    {
      id: "ad-srv-2",
      title: "طراحی هویت بصری، تبلیغات دیجیتال و بسته‌بندی کاتالوگ کارخانجات",
      description: "طراحی کاملاً حرفه‌ای و متناسب با سلیقه روز بازار برای بسته‌بندی محصولات، چاپ سلفون، جعبه قند و شکر، قوطی رب، کارتن‌های مادر و طراحی کاتالوگ‌های فروش نمایشگاهی. ارتقای جدی جذابیت بصری برند شما.",
      factoryName: "استودیو طراحی نوین طرح فردا",
      contactPerson: "خانم مهندس راد",
      contactPhone: "۰۹۱۲۸۸۸۴۴۳۳",
      badgeText: "🛠️ خدمات طراحی و تبلیغاتی",
      category: "service",
      quantity: "پروژه‌ای",
      wholesalePrice: "توافقی (زیر قیمت بازار)",
      marketPrice: "ارزش‌گذاری بر اساس کیفیت کار",
      buyerProfit: "۳۰٪ تخفیف ویژه اعضای پورتال دست‌اول",
      isSponsored: true,
      date: "۱۴۰۵/۰۵/۲۲",
      imageUrl: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&q=80&w=400",
      status: "approved"
    },
    {
      id: "ad-srv-3",
      title: "خدمات جامع حسابداری، حسابرسی مالی و تنظیم اظهارنامه کارخانجات",
      description: "اصلاح و استقرار سیستم‌های یکپارچه انبار، بهای تمام‌شده صنعتی، تنظیم و دفاع از دفاتر قانونی، صورت‌های مالی حسابرسی‌شده و کلیه اظهارنامه‌های فصلی و ارزش افزوده جهت کاهش قانونی ریسک‌های مالیاتی.",
      factoryName: "موسسه خدمات حسابرسی امین تراز الوند",
      contactPerson: "جناب آقای دکتر ناصری",
      contactPhone: "۰۹۱۲۱۱۱۲۲۴۴",
      badgeText: "🛠️ خدمات حسابداری و مالی",
      category: "service",
      quantity: "مشاوره و قرارداد سالانه",
      wholesalePrice: "قرارداد منعطف ماهانه",
      marketPrice: "مطابق با تعرفه رسمی کانون",
      buyerProfit: "کاهش جرائم مالیاتی و استقرار انضباط مالی",
      isSponsored: false,
      date: "۱۴۰۵/۰۵/۲۱",
      imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=400",
      status: "approved"
    }
  ];

  useEffect(() => {
    const savedAds = localStorage.getItem("dastavval_sponsored_ads_v2");
    if (savedAds) {
      try {
        const parsed = JSON.parse(savedAds);
        const hasServices = parsed.some((item: any) => item.category === "service");
        if (!hasServices) {
          const services = initialAds.filter(item => item.category === "service");
          const merged = [...parsed, ...services];
          setAds(merged);
          localStorage.setItem("dastavval_sponsored_ads_v2", JSON.stringify(merged));
        } else {
          setAds(parsed);
        }
      } catch (e) {
        setAds(initialAds);
      }
    } else {
      setAds(initialAds);
      localStorage.setItem("dastavval_sponsored_ads_v2", JSON.stringify(initialAds));
    }
  }, []);

  const saveAdsToStorage = (newAds: AdItem[]) => {
    setAds(newAds);
    localStorage.setItem("dastavval_sponsored_ads_v2", JSON.stringify(newAds));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper to validate and clean phone number inputs in descriptions to ensure site mediation
  const detectAndScrubPhoneNumbers = (text: string) => {
    const phoneRegex = /(۰|0|۹|9)[۰-۹0-9]{9,10}/g;
    return text.replace(phoneRegex, "[تلفن مستقیم طبق قوانین حذف شد - معامله از طریق واسطه امن]");
  };

  const handleCreateAdAdminApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !wholesalePrice || !marketPrice || !contactPhone) return;

    // Reject direct public display of phones and ensure rules are met
    const cleanTitle = detectAndScrubPhoneNumbers(title);
    const cleanDescription = detectAndScrubPhoneNumbers(description);

    // Rule enforcement: Check if user mentions a common forbidden brand to protect reputation
    const forbiddenBrands = ["چی‌توز", "مینو", "میهن", "تبرک", "یک‌ویک", "تبرک", "چی توز", "دامداران", "کاله"];
    let finalTitle = cleanTitle;
    let finalDesc = cleanDescription;
    
    forbiddenBrands.forEach(brand => {
      if (finalTitle.includes(brand) || finalDesc.includes(brand)) {
        finalTitle = finalTitle.replace(new RegExp(brand, "g"), "[برند تجاری طبق قوانین سانسور شد]");
        finalDesc = finalDesc.replace(new RegExp(brand, "g"), "[به منظور جلوگیری از آسیب به اعتبار نمایندگی‌های رسمی، نام برند تجاری حذف و با کلمه عمومی جایگزین گردید]");
      }
    });

    // Auto calculate buyer savings if empty
    const numericWholesale = parseInt(wholesalePrice.replace(/[^0-9]/g, "")) || 10000;
    const numericMarket = parseInt(marketPrice.replace(/[^0-9]/g, "")) || 15000;
    const savings = numericMarket - numericWholesale;
    const profitPercentage = Math.round((savings / numericMarket) * 100) || 30;
    const calculatedProfitText = `${profitPercentage}٪ سود ناخالص (${savings.toLocaleString()} تومان اختلاف)`;

    let finalBadge = "📦 تامین مستقیم";
    if (category === "raw_material") finalBadge = "📦 مواد اولیه صنعتی";
    else if (category === "service") finalBadge = "🛠️ خدمات صنعتی";
    else if (category === "under_market") finalBadge = "📉 زیر قیمت بازار";
    else if (category === "liquid") finalBadge = "🔥 حراج عمده";

    const newAd: AdItem = {
      id: `ad-${Date.now()}`,
      title: finalTitle,
      description: finalDesc || (category === "service" ? "ارائه خدمات صنعتی و تجاری ویژه کارخانجات تحت نظارت و معامله امن دست اول." : "درخواست خرید کالا با شرایط توافقی و ضمانت پرداخت امن واسطه‌ای دست اول."),
      factoryName: factoryName || (category === "service" ? "مجموعه خدمات صنعتی معتبر" : "متقاضی تامین مستقیم"),
      contactPerson: contactPerson || "مدیریت مربوطه",
      contactPhone: contactPhone, // Saved privately for admin use
      badgeText: finalBadge,
      category,
      quantity: quantity || (category === "service" ? "پروژه‌ای / توافقی" : "توافقی"),
      wholesalePrice: wholesalePrice.includes("تومان") || wholesalePrice.includes("توافقی") ? wholesalePrice : `${wholesalePrice} تومان`,
      marketPrice: marketPrice.includes("تومان") || marketPrice.includes("توافقی") ? marketPrice : `${marketPrice} تومان`,
      buyerProfit: buyerProfit || calculatedProfitText,
      isSponsored: false,
      date: new Date().toLocaleDateString("fa-IR"),
      imageUrl: uploadedImages[0] || uploadedImage || getAdFallbackImage(finalTitle, category),
      imageUrls: uploadedImages.length > 0 ? uploadedImages : (uploadedImage ? [uploadedImage] : []),
      status: "pending", // Starts as pending, needs admin approval!
      specialRequest: isSpecialRequested,
      specialRequestMessage: isSpecialRequested ? specialMessage : undefined
    };

    const updated = [newAd, ...ads];
    saveAdsToStorage(updated);
    
    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      setIsSubmitModalOpen(false);
      // Reset form
      setTitle("");
      setDescription("");
      setFactoryName("");
      setContactPerson("");
      setContactPhone("");
      setQuantity("");
      setWholesalePrice("");
      setMarketPrice("");
      setBuyerProfit("");
      setUploadedImage(null);
      setUploadedImages([]);
    }, 4500);
  };

  // Admin Actions to approve/reject
  const handleApproveAd = (id: string) => {
    const updated = ads.map(ad => {
      if (ad.id === id) {
        return { 
          ...ad, 
          status: "approved" as const,
          badgeText: ad.category === "under_market" ? "📉 زیر قیمت بازار" : ad.category === "liquid" ? "🔥 حراج عمده" : ad.category === "raw_material" ? "📦 مواد اولیه صنعتی" : ad.category === "service" ? "🛠️ خدمات صنعتی" : "📦 تامین مستقیم" 
        };
      }
      return ad;
    });
    saveAdsToStorage(updated);
  };

  const handleRejectAd = (id: string, reason: string = "عدم انطباق با قوانین عدم افشای مستقیم برند") => {
    const updated = ads.map(ad => {
      if (ad.id === id) {
        return { ...ad, status: "rejected" as const, rejectionReason: reason };
      }
      return ad;
    });
    saveAdsToStorage(updated);
  };

  // Reset demo data to default to clean slate
  const handleResetDemoData = () => {
    saveAdsToStorage(initialAds);
  };

  // Filtering Logic
  const filteredAds = ads.filter((ad) => {
    // Show only approved ones on the main public dashboard
    const isApproved = ad.status === "approved";
    
    const matchesSearch = 
      ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ad.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ad.factoryName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeCategoryFilter === "all" || ad.category === activeCategoryFilter;
    
    return isApproved && matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (a.isSponsored && !b.isSponsored) return -1;
    if (!a.isSponsored && b.isSponsored) return 1;
    return 0;
  });

  // Pending ads for admin view
  const pendingAds = ads.filter(ad => ad.status === "pending" || !ad.status);

  // Escrow Handler
  const handleEscrowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerPhoneInput || !escrowModalAd) return;
    setEscrowLoading(true);
    
    const newId = `SB-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReq = {
      id: newId,
      adId: escrowModalAd.id || '',
      productTitle: escrowModalAd.title || 'کالای زیر قیمت',
      wholesalePrice: escrowModalAd.wholesalePrice || 'توافقی',
      marketPrice: escrowModalAd.marketPrice || '',
      buyerProfit: escrowModalAd.buyerProfit || '',
      quantity: escrowModalAd.quantity || 'نامشخص',
      brand: escrowModalAd.factoryName || 'نامشخص',
      description: escrowModalAd.description || '',
      buyerPhone: buyerPhoneInput,
      buyerMessage: buyerMessage || '',
      status: 'pending',
      date: new Date().toLocaleDateString('fa-IR'),
      createdAt: new Date().toISOString()
    };

    try {
      // 1. Save to mock/real Firestore
      await addDoc(collection(db, "safe_buy_requests"), newReq);
      
      // 2. Also save to localStorage as a fallback
      const existing = JSON.parse(localStorage.getItem("dastavval_safe_buy_requests") || "[]");
      localStorage.setItem("dastavval_safe_buy_requests", JSON.stringify([newReq, ...existing]));
    } catch (err) {
      console.error("Error saving safe buy request", err);
    }

    setTimeout(() => {
      setEscrowLoading(false);
      setEscrowSuccess(true);

      setTimeout(() => {
        setEscrowSuccess(false);
        setEscrowModalAd(null);
        setBuyerPhoneInput("");
        setBuyerMessage("");
      }, 3500);
    }, 1500);
  };

  const renderDetailModal = () => (
    <AnimatePresence>
      {selectedAdDetail && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto animate-fade-in"
          onClick={() => setSelectedAdDetail(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-2xl w-full max-w-xl border border-slate-100 text-right relative overflow-y-auto max-h-[90vh]"
            dir="rtl"
          >
            <button
              onClick={() => setSelectedAdDetail(null)}
              className="absolute top-5 left-5 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="space-y-6 mt-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                  <ShieldCheck size={12} />
                  واسطه‌گری امن پلتفرم دست‌اول
                </span>
                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                  <Calendar size={11} />
                  ثبت در {selectedAdDetail.date}
                </span>
              </div>

              {/* Product Image */}
              <div className="w-full h-56 rounded-2xl overflow-hidden bg-slate-50 relative">
                <img
                  src={selectedAdDetail.imageUrl || getAdFallbackImage(selectedAdDetail.title, selectedAdDetail.category)}
                  alt={selectedAdDetail.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-xl text-[10px] font-black text-slate-800 shadow-xs">
                  {selectedAdDetail.category === "liquid" ? "🔥 حراج مازاد خط تولید" : selectedAdDetail.category === "under_market" ? "📉 کف قیمت بازار" : selectedAdDetail.category === "raw_material" ? "📦 مواد اولیه صنعتی" : selectedAdDetail.category === "service" ? "🛠️ خدمات صنعتی و تجاری" : "📦 تامین کارخانه"}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-indigo-600 font-black block mb-1">
                  🏢 کارخانه یا تامین‌کننده: {selectedAdDetail.factoryName}
                </span>
                <h4 className="font-black text-sm sm:text-base text-slate-900 leading-relaxed">
                  {selectedAdDetail.title}
                </h4>
              </div>

              {/* PRICING TABULAR CARD (WHOLSALE vs MARKET vs DIFFERENCE) */}
              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-3.5">
                <div className="flex items-center gap-1.5 border-b border-slate-200/50 pb-2">
                  <BadgePercent size={16} className="text-emerald-600" />
                  <span className="text-xs font-black text-slate-800">شفاف‌سازی و تحلیل قیمت کالا (زیر قیمت بازار):</span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                    <span className="text-[9px] text-slate-400 font-black block mb-1">قیمت بازار آزاد:</span>
                    <span className="text-xs font-bold text-slate-500 line-through block">{selectedAdDetail.marketPrice}</span>
                  </div>
                  <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50 shadow-2xs">
                    <span className="text-[9px] text-emerald-800 font-black block mb-1">قیمت پیشنهادی کف:</span>
                    <span className="text-xs font-black text-emerald-700 block">{selectedAdDetail.wholesalePrice}</span>
                  </div>
                  <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/50 shadow-2xs">
                    <span className="text-[9px] text-amber-800 font-black block mb-1">حاشیه سود خریدار:</span>
                    <span className="text-[10px] font-black text-amber-700 block leading-tight">{selectedAdDetail.buyerProfit}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold pt-1.5">
                  <span>میزان بار موجود جهت بارگیری:</span>
                  <span className="text-slate-800 font-black">📦 {selectedAdDetail.quantity}</span>
                </div>
              </div>

              {/* Brand Protection Warning */}
              <div className="bg-amber-50/40 border border-amber-100 rounded-2xl p-4 flex gap-3 text-right">
                <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={16} />
                <div className="space-y-1">
                  <h5 className="text-[11px] font-black text-amber-900">سیاست صیانت و محافظت از ارزش برندهای تولیدی</h5>
                  <p className="text-[10px] text-amber-800/80 font-bold leading-relaxed">
                    به منظور ممانعت از ریزش ناگهانی قیمت رسمی و آسیب به شبکه نمایندگی‌های فعال کارخانه در کل کشور، مشخصات دقیق برند صرفاً به خریدار واقعی و پس از تایید توسط واسطه امن دست‌اول ارائه خواهد شد.
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-slate-400 block">شرح کامل درخواست و شرایط تحویل:</span>
                <p className="text-xs text-slate-600 leading-relaxed font-bold bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-line">
                  {selectedAdDetail.description}
                </p>
              </div>

              {/* Contact Proxy & Site Mediation Block */}
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-indigo-800">
                  <LockKeyhole size={16} />
                  <span className="text-[11px] font-black">اطلاعات تماس مستقیم (پنهان به دستور پلتفرم):</span>
                </div>
                <p className="text-[10px] text-indigo-700 font-bold leading-relaxed">
                  طبق قوانین پیشگیری از تخلف و انحصار بازار، برای برقراری ارتباط با مالک کالا باید درخواست انجام معامله خود را از طریق دکمه واسطه زیر ثبت نمایید. کارشناسان ما تا ۱۵ دقیقه آینده جهت هماهنگی‌های لازم اقدام می‌کنند.
                </p>

                <button
                  onClick={() => {
                    setEscrowModalAd(selectedAdDetail);
                    setSelectedAdDetail(null);
                  }}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  <ShieldCheck size={14} />
                  <span>ثبت درخواست معامله امن با واسطه‌گری دست‌اول</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Simple render implementation for Mini block on Main landing page
  if (isMini) {
    return (
      <div className="w-full mt-6 mb-12 max-w-7xl mx-auto px-4" id="ad-board-mini-container" dir="rtl">
        {/* Billboard Styled Header */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
              <TrendingDown size={22} className="animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-3 py-0.5 rounded-full">کف بازار</span>
                <h3 className="font-black text-sm text-slate-800">سامانه ملی «کف بازار» کالا و خدمات با ضمانت واسطه‌گری امن</h3>
              </div>
              <p className="text-[11px] text-slate-500 font-bold leading-relaxed max-w-2xl">
                بستری انحصاری برای ثبت درخواست کالا و مواد اولیه زیر قیمت بازار آزاد. کلیه مبادلات با نظارت مستقیم و واسطه‌گری امین پلتفرم صورت می‌پذیرد.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full lg:w-auto justify-end">
            <button
              onClick={onNavigateToBillboard}
              className="bg-slate-900 hover:bg-slate-850 text-white text-xs font-black px-4 py-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>مشاهده تالار کف بازار ({filteredAds.length} مورد)</span>
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => {
                setCategory("raw_material");
                setIsSubmitModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-4 py-3 rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Boxes size={14} />
              <span>📦 ثبت کالا و مواد اولیه</span>
            </button>
            <button
              onClick={() => {
                setCategory("service");
                setIsSubmitModalOpen(true);
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-black px-4 py-3 rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Briefcase size={14} />
              <span>🛠️ ثبت خدمات صنعتی</span>
            </button>
          </div>
        </div>

        {/* 3 Columns Displaying Latest Items with Beautiful Material Styling */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
          {filteredAds.slice(0, 3).map((ad) => {
            const adImg = ad.imageUrl || getAdFallbackImage(ad.title, ad.category);
            return (
              <div
                key={ad.id}
                onClick={() => setSelectedAdDetail(ad)}
                className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_30px_-6px_rgba(0,0,0,0.06)] transition-all duration-300 text-right cursor-pointer group flex flex-col justify-between h-[390px] relative"
              >
                {/* Image Banner */}
                <div className="h-32 w-full overflow-hidden bg-slate-50 relative shrink-0">
                  <img
                    src={adImg}
                    alt={ad.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-xl text-[9px] font-black text-slate-800 shadow-sm flex items-center gap-1">
                    <span>{ad.category === "under_market" ? "📉 کف قیمت" : ad.category === "liquid" ? "🔥 حراج" : ad.category === "raw_material" ? "📦 مواد اولیه" : ad.category === "service" ? "🛠️ خدمات" : "📦 تامین"}</span>
                  </div>
                </div>

                {/* Card Content with padded text */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-400 font-black">{ad.date}</span>
                        {ad.isSponsored && (
                          <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-lg text-[9px] font-black border border-amber-200 flex items-center gap-1">
                            <Sparkles size={10} />
                            ویژه
                          </span>
                        )}
                      </div>
                      <span className="bg-slate-50 text-slate-600 text-[9px] font-black px-2.5 py-0.5 rounded-lg border border-slate-100">
                        {ad.badgeText}
                      </span>
                    </div>

                    <h4 className="font-black text-xs text-slate-800 leading-relaxed group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {ad.title}
                    </h4>
                    
                    {/* Clear price highlights for buyers */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px] font-bold text-slate-600 my-1">
                      <div>
                        <span className="text-slate-400 block text-[8px]">قیمت عمده:</span>
                        <span className="text-emerald-700 font-black">{ad.wholesalePrice}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[8px]">سود شما:</span>
                        <span className="text-amber-700 font-black">{ad.buyerProfit.split(" ")[0]} سود</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-bold">
                    <span className="text-indigo-600 font-black">{ad.factoryName}</span>
                    <span className="flex items-center gap-1 text-emerald-600 font-black group-hover:translate-x-1 transition-transform">
                      <span>ثبت معامله امن</span>
                      <ArrowUpRight size={11} className="rotate-90" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit Modal for isMini Mode */}
        <AnimatePresence>
          {isSubmitModalOpen && renderSubmitModal()}
        </AnimatePresence>
      </div>
    );
  }

  // FULL PAGE / TAB MODE
  return (
    <div className="w-full mt-6 mb-12 max-w-7xl mx-auto px-4" id="ad-board-full-container" dir="rtl">
      
      {/* Brand Protection and Guidelines Panel (Collapsible) */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-950 rounded-[2.5rem] p-6 sm:p-8 text-white shadow-xl mb-8 relative overflow-hidden transition-all duration-500">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-700/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-0 bottom-0 w-64 h-64 bg-emerald-700/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between lg:justify-start gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-amber-400 text-slate-950 rounded-xl flex items-center justify-center font-black shadow-lg">
                  <TrendingDown size={20} />
                </div>
                <div>
                  <span className="text-amber-300 font-black text-[9px] uppercase tracking-wider block">سامانه هوشمند دست اول</span>
                  <h1 className="font-black text-base sm:text-xl text-white">سامانه ملی «کف بازار» کالا و خدمات زیر قیمت بازار آزاد</h1>
                </div>
              </div>
              
              <button 
                onClick={() => setIsIntroExpanded(!isIntroExpanded)}
                className="lg:hidden w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <ChevronDown size={18} className={`transition-transform duration-300 ${isIntroExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
            
            <motion.div 
              initial={false}
              animate={{ height: isIntroExpanded || window.innerWidth > 1024 ? "auto" : 0, opacity: isIntroExpanded || window.innerWidth > 1024 ? 1 : 0 }}
              className="overflow-hidden space-y-4"
            >
              <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-3xl">
                این پلتفرم فضایی اختصاصی جهت عرضه بارهای مازاد کارخانجات و ثبت رسمی تقاضای خرید کالا با حاشیه سودهای استثنایی است. کلیه تعاملات با واسطه‌گری امین دست‌اول انجام می‌گردد تا امنیت و حفظ هویت خریداران و فروشندگان کاملاً صیانت شود.
              </p>

              {/* Crucial brand safety instruction card */}
              <div className="bg-white/5 backdrop-blur-md rounded-3xl p-5 border border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
                <div className="space-y-2">
                  <h4 className="text-amber-300 font-black text-xs flex items-center gap-1.5">
                    <ShieldAlert size={14} />
                    دستورالعمل صیانت از اعتبار برندها:
                  </h4>
                  <p className="text-[10px] text-slate-200 font-bold leading-relaxed">
                    ذکر مستقیم نام تجاری و تجاری کارخانه ممنوع است. نام‌ها باید به صورت عمومی درج شوند (مثلا: "۲ تن نوشمک یخی" یا "قند کله ۵ کیلویی") تا از ریزش قیمت نمایندگی‌های رسمی کارخانه جلوگیری شده و اعتبار برند حفظ گردد.
                  </p>
                </div>
                <div className="border-t md:border-t-0 md:border-r border-white/15 pt-4 md:pt-0 md:pr-6 space-y-1.5 text-[10px] text-slate-300">
                  <span className="font-black text-white block mb-1">قوانین حاکم بر معاملات تالار:</span>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400">✔️</span>
                    <span>لزوم ثبت قیمت عمده واقعی و قیمت بازار جهت شفاف‌سازی.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400">✔️</span>
                    <span>ممنوعیت کامل درج شماره تلفن مستقیم در عناوین یا شرح جهت واسطه‌گری امن.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400">✔️</span>
                    <span>تمامی بارها پیش از بارگیری باید به تایید کارشناسی ناظر دست‌اول برسند.</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="w-full lg:w-auto shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2.5">
            <button
              onClick={() => {
                setCategory("raw_material");
                setIsSubmitModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-6 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer active:scale-95"
            >
              <Boxes size={16} />
              <span>📦 عرضه مستقیم مواد اولیه (تامین‌کننده)</span>
            </button>
            <button
              onClick={() => {
                setCategory("service");
                setIsSubmitModalOpen(true);
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-black px-6 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 cursor-pointer active:scale-95"
            >
              <Briefcase size={16} />
              <span>🛠️ ثبت خدمات صنعتی و تجاری (طراحی، گمرک...)</span>
            </button>
            <button
              onClick={() => {
                setCategory("under_market");
                setIsSubmitModalOpen(true);
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black px-6 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95 text-right"
            >
              <Plus size={16} />
              <span>ثبت عرضه محصول زیر قیمت</span>
            </button>
            <button 
              onClick={() => setIsIntroExpanded(!isIntroExpanded)}
              className="hidden lg:flex items-center justify-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-white transition-colors"
            >
              {isIntroExpanded ? "بستن راهنما" : "مشاهده راهنما و قوانین"}
              <ChevronDown size={12} className={`transition-transform duration-300 ${isIntroExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* REAL-TIME GUILD AUDIT & INSPECTION PANEL */}
      <AnimatePresence>
        {isAdminPanelOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-6 mb-6 text-right overflow-hidden shadow-sm"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-amber-200/60 pb-4 mb-4 gap-2">
              <div className="flex items-center gap-2">
                <UserCheck size={18} className="text-amber-800" />
                <h3 className="font-black text-xs sm:text-sm text-amber-900">میز کارشناس ناظر و ارزیاب کیفیت دست‌اول (تأیید فاکتور و تناژ)</h3>
              </div>
              <div className="flex items-center gap-2 self-end">
                <button 
                  onClick={handleResetDemoData}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                >
                  بازنشانی کل لیست به پیش‌فرض پلتفرم
                </button>
                <span className="text-[10px] text-amber-800 font-black bg-amber-100/80 px-2.5 py-1 rounded-full border border-amber-200">
                  {pendingAds.length} پرونده در دست بررسی و ارزیابی قیمتی
                </span>
              </div>
            </div>

            {pendingAds.length === 0 ? (
              <p className="text-xs text-amber-800/80 font-bold text-center py-6">
                هیچ درخواست جدیدی در صف بازرسی فنی وجود ندارد. تولیدکنندگان محترم می‌توانند درخواست عرضه بار خود را از دکمه ثبت کالا بالا ارسال نمایند.
              </p>
            ) : (
              <div className="space-y-3">
                {pendingAds.map((pAd) => (
                  <div key={pAd.id} className="bg-white border border-amber-200/50 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-md">
                          ⏳ منتظر بررسی
                        </span>
                        <span className="text-slate-400 text-[10px] font-mono">{pAd.date}</span>
                        <span className="text-[10px] text-slate-500 font-bold">متقاضی: {pAd.contactPerson}</span>
                        <span className="text-[10px] text-indigo-600 font-black bg-indigo-50 px-2 rounded-md">تلفن محفوظ: {pAd.contactPhone}</span>
                      </div>
                      <h4 className="font-black text-xs text-slate-800">{pAd.title}</h4>
                      <p className="text-[10px] text-slate-500 font-bold leading-relaxed line-clamp-1">{pAd.description}</p>
                      
                      <div className="flex flex-wrap gap-4 text-[10px] font-bold text-slate-700 pt-1">
                        <span>💰 عمده پیشنهادی: <strong className="text-emerald-600">{pAd.wholesalePrice}</strong></span>
                        <span>💸 قیمت بازار: <strong className="text-slate-500">{pAd.marketPrice}</strong></span>
                        <span>📈 سود خریدار: <strong className="text-amber-600">{pAd.buyerProfit}</strong></span>
                        <span>📦 میزان: <strong>{pAd.quantity}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <button
                        onClick={() => handleApproveAd(pAd.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-3.5 py-2 rounded-xl cursor-pointer transition-colors flex items-center gap-1"
                      >
                        <Check size={11} />
                        <span>تأیید و انتشار عمومی</span>
                      </button>
                      <button
                        onClick={() => handleRejectAd(pAd.id)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-black px-3.5 py-2 rounded-xl cursor-pointer transition-colors"
                      >
                        رد درخواست
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Searching and Categorization */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex flex-col md:flex-row gap-4 items-center justify-between mb-8" dir="rtl">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-1.5 h-8 bg-indigo-600 rounded-full shrink-0" />
          <div className="text-right">
            <h3 className="text-xs sm:text-sm font-black text-slate-800">فهرست رصد فرصت‌های کف قیمت</h3>
            <p className="text-[10px] text-slate-400 font-bold">بارهای مازاد، کف قیمت تولیدی و تامین دست‌اول</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
          <div className="relative w-full sm:w-60">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی عنوان کالا یا کارخانه..."
              className="w-full bg-slate-50 border border-slate-100 rounded-xl pr-9 pl-3 py-2.5 text-xs font-black outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-800 text-right"
            />
            <Search size={14} className="absolute right-3 top-3 text-slate-400" />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none shrink-0">
            {[
              { value: "all", label: "همه موارد" },
              { value: "raw_material", label: "📦 مواد اولیه" },
              { value: "service", label: "🛠️ خدمات صنعتی" },
              { value: "under_market", label: "📉 کف قیمت" },
              { value: "liquid", label: "🔥 مازاد کارخانه" },
              { value: "direct_supply", label: "📦 تامین مستقیم" },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveCategoryFilter(filter.value as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 border ${
                  activeCategoryFilter === filter.value
                    ? "bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-600/20 scale-105"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="w-full max-w-4xl mx-auto space-y-4">
        {filteredAds.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-bold bg-white border border-slate-100 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
            هیچ آگهی معتبری در این دسته‌بندی یافت نشد. می‌توانید با کلیک بر روی دکمه ثبت درخواست، اولین تقاضای خود را ثبت و پس از ممیزی در پنل نظارت مدیریت پلتفرم تایید نمایید.
          </div>
        ) : (
          <div className="flex flex-col gap-4 animate-in fade-in duration-500">
            {filteredAds.map((ad) => {
              const adImg = ad.imageUrl || getAdFallbackImage(ad.title, ad.category);
              return (
                <div
                  key={ad.id}
                  onClick={() => setSelectedAdDetail(ad)}
                  className={`p-4 rounded-3xl border text-right flex flex-col sm:flex-row gap-4 h-auto sm:h-[160px] transition-all cursor-pointer overflow-hidden bg-white border-slate-100 hover:border-emerald-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] group relative hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.05)]`}
                >
                  {/* Compact Image Thumbnail */}
                  <div className="w-full sm:w-36 h-36 sm:h-full rounded-2xl overflow-hidden shrink-0 bg-slate-50 relative">
                    <img
                      src={adImg}
                      alt={ad.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className={`absolute bottom-2 right-2 px-2.5 py-0.5 rounded-lg text-[8px] font-black text-white shadow-sm ${
                      ad.category === "liquid" 
                        ? "bg-amber-600" 
                        : ad.category === "under_market" 
                          ? "bg-emerald-600" 
                          : ad.category === "raw_material"
                            ? "bg-indigo-600"
                            : ad.category === "service"
                              ? "bg-teal-600"
                              : "bg-blue-600"
                    }`}>
                      {ad.category === "liquid" ? "🔥 حراج" : ad.category === "under_market" ? "📉 کف قیمت" : ad.category === "raw_material" ? "📦 مواد اولیه" : ad.category === "service" ? "🛠️ خدمات" : "📦 تامین"}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 flex flex-col justify-between min-w-0 py-1">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-400 font-black">{ad.date}</span>
                          {ad.isSponsored && (
                            <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-[8px] font-black border border-amber-200/60 flex items-center gap-0.5">
                              <Sparkles size={8} />
                              طلایی دست اول
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-black flex items-center gap-1 max-w-[180px] truncate">
                          <Building2 size={11} className="text-slate-400 shrink-0" />
                          {ad.factoryName}
                        </span>
                      </div>

                      <h5 className="font-black text-xs md:text-sm text-slate-800 leading-relaxed truncate group-hover:text-indigo-600 transition-colors">
                        {ad.title}
                      </h5>
                      <p className="text-[11px] text-slate-400 font-bold leading-relaxed line-clamp-1">
                        {ad.description}
                      </p>
                    </div>

                    {/* Highly readable PRICING strip in list view */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50/70 border border-slate-100 p-2 rounded-2xl text-[10px] font-bold text-slate-600 my-1">
                      <div>
                        <span className="text-slate-400 text-[8px] block">قیمت بازار آزاد:</span>
                        <span className="text-slate-500 line-through">{ad.marketPrice}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[8px] block">قیمت پیشنهادی کف:</span>
                        <span className="text-emerald-700 font-black">{ad.wholesalePrice}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[8px] block">سود ناخالص خریدار:</span>
                        <span className="text-amber-700 font-black">{ad.buyerProfit.split(" ")[0]}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 mt-auto border-t border-slate-100/70 text-[10px]">
                      <span className="text-slate-400">میزان موجودی: <strong className="text-slate-700">{ad.quantity}</strong></span>
                      <span className="text-indigo-600 font-black flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>جزئیات و درخواست معامله امن</span>
                        <ArrowUpRight size={12} className="rotate-90" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Secure Escrow Transaction Modal */}
      <AnimatePresence>
        {escrowModalAd && (
          <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-md rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-2xl relative text-right"
              dir="rtl"
            >
              <button
                onClick={() => setEscrowModalAd(null)}
                className="absolute top-5 left-5 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center transition-colors cursor-pointer text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>

              {escrowSuccess ? (
                <div className="py-8 flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100 animate-bounce">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="font-black text-slate-800 text-sm">درخواست معامله امن ثبت شد</h4>
                  <p className="text-xs text-slate-500 font-bold max-w-xs leading-relaxed">
                    درخواست شما در سیستم مدیریت معاملات امین دست‌اول ثبت گردید. کارشناسان ما تا حداکثر ۱۵ دقیقه آینده جهت بررسی تناژ و هماهنگی عقد قرارداد واسطه‌ای با شما تماس خواهند گرفت.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleEscrowSubmit} className="space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <ShieldCheck className="text-indigo-600 animate-pulse" size={18} />
                    <h4 className="font-black text-slate-800 text-sm">شروع معامله امن (واسطه‌گری پلتفرم دست‌اول)</h4>
                  </div>

                  <p className="text-[11px] text-slate-500 font-bold leading-relaxed bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
                    کالا: <strong className="text-slate-800">{escrowModalAd.title}</strong><br />
                    قیمت کف پیشنهادی: <strong className="text-emerald-700">{escrowModalAd.wholesalePrice}</strong><br />
                    تضمین معامله: وجه شما در حساب امانی تا تحویل کامل بار محفوظ می‌ماند.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 mb-1.5">شماره موبایل خریدار جهت هماهنگی کارشناس:</label>
                      <input
                        type="tel"
                        required
                        value={buyerPhoneInput}
                        onChange={(e) => setBuyerPhoneInput(e.target.value)}
                        placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600 font-mono text-left"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 mb-1.5">پیام یا شرایط خاص درخواستی (اختیاری):</label>
                      <textarea
                        value={buyerMessage}
                        onChange={(e) => setBuyerMessage(e.target.value)}
                        placeholder="مثال: ترجیحاً تحویل در شهرک صنعتی توس مشهد"
                        rows={2}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600 resize-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={escrowLoading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    {escrowLoading ? "در حال ثبت درخواست..." : "ارسال درخواست معامله به بخش نظارت پلتفرم"}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      {renderDetailModal()}

      {/* Submit Modal inside Full Page Mode */}
      <AnimatePresence>
        {isSubmitModalOpen && renderSubmitModal()}
      </AnimatePresence>
    </div>
  );

  // Reusable Material Design Modal for Registering Product Requests
  function renderSubmitModal() {
    return (
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white w-full max-w-xl rounded-[28px] border border-slate-100 p-6 sm:p-8 shadow-2xl relative text-right my-8 max-h-[90vh] overflow-y-auto"
          dir="rtl"
        >
          {/* Close button with subtle hover animation */}
          <button
            onClick={() => setIsSubmitModalOpen(false)}
            className="absolute top-5 left-5 w-9 h-9 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center transition-all hover:bg-slate-200 hover:text-slate-800 cursor-pointer text-sm font-bold"
          >
            ✕
          </button>

          {submitSuccess ? (
            <div className="py-10 flex flex-col items-center text-center space-y-5">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100 shadow-md shadow-emerald-100/50 animate-bounce">
                <CheckCircle2 size={40} />
              </div>
              <h4 className="font-black text-slate-900 text-base">درخواست شما با موفقیت ثبت گردید</h4>
              <p className="text-xs text-slate-500 font-bold max-w-sm leading-relaxed">
                اطلاعات با موفقیت ذخیره گردید و جهت تایید فنی در صف بررسی کارشناسان دست‌اول قرار گرفت. به محض تایید، آگهی شما فعال و قابل معامله امن خواهد شد.
              </p>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md"
              >
                بستن پنجره
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateAdAdminApproval} className="space-y-5 text-right">
              {/* Header Title */}
              <div className="flex items-center gap-3 pb-4 border-b border-slate-150">
                <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Briefcase size={20} />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">درج محصول یا خدمات جدید</h4>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">معرفی مستقیم کالا و ظرفیت‌های صنعتی به کارخانجات سراسر کشور</p>
                </div>
              </div>

              {/* Informative Security and Compliance Guideline Box */}
              <div className="bg-gradient-to-r from-indigo-50/70 to-blue-50/70 border border-indigo-100/60 rounded-2xl p-4 flex gap-3 text-[11px] text-indigo-950 font-medium leading-relaxed shadow-xs">
                <AlertTriangle className="text-indigo-600 shrink-0 mt-0.5" size={16} />
                <div>
                  <span className="font-black block text-indigo-900 mb-0.5">امنیت و واسطه‌گری امین دست‌اول:</span>
                  کلیه هماهنگی‌های مالی، آنالیزهای فنی بار و عقد قراردادهای رسمی جهت محافظت از خریدار و فروشنده، به صورت مستقیم و امن توسط مدیریت واسطه‌گری پلتفرم دست‌اول صورت می‌پذیرد.
                </div>
              </div>

              <div className="space-y-4">
                {/* Modern Material Card-Based Category Selection */}
                <div>
                  <label className="block text-[11px] font-black text-slate-500 mb-2">انتخاب دسته‌بندی اصلی درخواست:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCategory("raw_material")}
                      className={`p-4 rounded-2xl border text-right transition-all cursor-pointer relative flex flex-col justify-between ${
                        category === "raw_material"
                          ? "bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-sm font-black text-slate-800">📦 تامین مواد اولیه صنعتی</span>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${category === "raw_material" ? "border-indigo-600" : "border-slate-300"}`}>
                          {category === "raw_material" && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold mt-2 leading-relaxed">
                        بارهای فله، کاتالیزورها، مواد معدنی، شیمیایی، چسب و گرانول‌های خط تولید
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCategory("service")}
                      className={`p-4 rounded-2xl border text-right transition-all cursor-pointer relative flex flex-col justify-between ${
                        category === "service"
                          ? "bg-teal-50/80 border-teal-500 ring-2 ring-teal-500/20 shadow-sm"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-sm font-black text-slate-800">🛠️ خدمات تجاری و صنعتی</span>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${category === "service" ? "border-teal-600" : "border-slate-300"}`}>
                          {category === "service" && <div className="w-2 h-2 rounded-full bg-teal-600" />}
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold mt-2 leading-relaxed">
                        خدمات گمرکی، ترخیص، طراحی قالب و ماشین‌آلات، حسابرسی انبار، بازاریابی و تبلیغات صنعتی
                      </p>
                    </button>
                  </div>
                </div>

                {/* Subcategory helper text specifically requested by user */}
                {category === "service" && (
                  <div className="bg-teal-50/40 border border-teal-100/50 rounded-xl p-3 text-[10px] text-teal-900 font-bold flex gap-2">
                    <span>💡</span>
                    <span>مثال‌های خدمات قابل ثبت: طراحی صنعتی و قالب‌سازی، تبلیغات تخصصی صنف، امور ترخیص گمرکی و پیله‌وری، بازرسی کالا و حسابرسی صنعتی.</span>
                  </div>
                )}

                {/* Requested Product Title */}
                <div>
                  <label className="block text-[11px] font-black text-slate-500 mb-1.5">
                    {category === "service" ? "عنوان دقیق خدمت صنعتی یا تجاری:" : "نام عمومی کالا یا مواد اولیه صنعتی (بدون برند انحصاری):"}
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (/(۰|0|۹|9)[۰-۹0-9]{9,10}/.test(e.target.value)) {
                        setPhoneWarning("درج شماره تماس مستقیم در فیلد عنوان ممنوع است. هماهنگی‌ها بصورت امن و واسطه‌ای صورت می‌گیرد.");
                      } else {
                        setPhoneWarning("");
                      }
                    }}
                    placeholder={category === "service" ? "مثال: ترخیص پیله‌وری و گمرک بازرگان یا حسابرسی انبار و بهای تمام‌شده" : "مثال: ۲۰ تن روغن جانشین کره کاکائو مالزی CBS"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600 transition-colors"
                  />
                  {phoneWarning && <span className="text-[10px] text-rose-500 font-bold block mt-1">{phoneWarning}</span>}
                </div>

                {/* Target Brand / Factory */}
                <div>
                  <label className="block text-[11px] font-black text-slate-500 mb-1.5">
                    {category === "service" ? "نام مجموعه، کارگزاری یا دفتر خدماتی شما:" : "کارخانه یا برند تولیدکننده (اختیاری):"}
                  </label>
                  <input
                    type="text"
                    value={factoryName}
                    onChange={(e) => setFactoryName(e.target.value)}
                    placeholder={category === "service" ? "مثال: کارگزاری جهان ترخیص آریا یا استودیو قالب‌سازی راد" : "مثال: کشت و صنعت دهخدا یا فرقی ندارد"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600 transition-colors"
                  />
                </div>

                {/* Pricing Metrics Group */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 mb-1.5">
                      {category === "service" ? "هزینه / تعرفه پایه پیشنهادی:" : "قیمت عمده کف پیشنهادی:"}
                    </label>
                    <input
                      type="text"
                      required
                      value={wholesalePrice}
                      onChange={(e) => setWholesalePrice(e.target.value)}
                      placeholder={category === "service" ? "مثال: مطابق با تعرفه یا توافقی" : "مثال: ۱۴۵,۰۰۰ تومان"}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 mb-1.5">
                      {category === "service" ? "تعرفه عمومی صنف (بازار آزاد):" : "قیمت بازار آزاد:"}
                    </label>
                    <input
                      type="text"
                      required
                      value={marketPrice}
                      onChange={(e) => setMarketPrice(e.target.value)}
                      placeholder={category === "service" ? "مثال: ارزش واقعی کار" : "مثال: ۱۶۵,۰۰۰ تومان"}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 mb-1.5">
                      {category === "service" ? "حداقل پذیرش / ظرفیت کار:" : "میزان بار / تناژ عرضه شده:"}
                    </label>
                    <input
                      type="text"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder={category === "service" ? "مثال: قراردادی یا پروژه‌ای" : "مثال: ۲۰ تن"}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600"
                    />
                  </div>
                </div>

                {/* Secure Contact Information (Hidden publicly) */}
                <div className="grid grid-cols-2 gap-3 bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100/20">
                  <div className="col-span-2 flex items-center gap-1.5 text-indigo-900 text-[10px] font-black mb-1">
                    <Lock size={12} className="text-indigo-600" />
                    <span>اطلاعات هماهنگی کارشناسی (محفوظ نزد ادمین جهت معامله امن واسطه‌ای):</span>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 mb-1">نام و نام خانوادگی:</label>
                    <input
                      type="text"
                      required
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="مثال: مهندس رضوانی"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 mb-1">شماره تماس (محفوظ و مخفی):</label>
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-850 outline-none focus:border-indigo-500 font-mono text-left"
                    />
                  </div>
                </div>

                {/* Multiple Image Upload Component with Drag & Drop and clear Counter */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[11px] font-black text-slate-500">
                      تصاویر محصول، اسناد آنالیز فنی یا کاتالوگ خدمات (آپلود چندگانه):
                    </label>
                    <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {uploadedImages.length} از ۵ تصویر آپلود شده
                    </span>
                  </div>
                  
                  {uploadedImages.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      {uploadedImages.map((imgUrl, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-300 bg-white shadow-xs">
                          <img src={imgUrl} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 left-1 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full transition-colors cursor-pointer shadow-sm"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      ))}
                      {uploadedImages.length < 5 && (
                        <label className="border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:bg-slate-100 hover:border-indigo-400 cursor-pointer aspect-square transition-all">
                          <Camera size={20} className="text-slate-400 animate-pulse" />
                          <span className="text-[9px] font-black mt-1">افزودن عکس</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files) {
                                Array.from(e.target.files).forEach((file) => {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setUploadedImages((prev) => [...prev, reader.result as string]);
                                  };
                                  reader.readAsDataURL(file);
                                });
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingImage(true);
                      }}
                      onDragLeave={() => setIsDraggingImage(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingImage(false);
                        if (e.dataTransfer.files) {
                          Array.from(e.dataTransfer.files).forEach((file) => {
                            if (file.type.startsWith("image/")) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setUploadedImages((prev) => [...prev, reader.result as string]);
                              };
                              reader.readAsDataURL(file);
                            }
                          });
                        }
                      }}
                      className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                        isDraggingImage
                          ? "border-indigo-500 bg-indigo-50/50"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-indigo-400"
                      }`}
                      onClick={() => document.getElementById("adboard-multi-upload")?.click()}
                    >
                      <input
                        id="adboard-multi-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) {
                            Array.from(e.target.files).forEach((file) => {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setUploadedImages((prev) => [...prev, reader.result as string]);
                              };
                              reader.readAsDataURL(file);
                            });
                          }
                        }}
                      />
                      <UploadCloud className="text-indigo-600 mx-auto" size={28} />
                      <span className="text-xs font-black text-slate-800 block mt-2">
                        کشیدن و رها کردن تصاویر نمونه کالا یا اسناد آنالیز
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        یا جهت انتخاب مستقیم از گالری کلیک کنید (قابلیت انتخاب همزمان چند فایل)
                      </span>
                    </div>
                  )}
                </div>

                {/* Description Textarea */}
                <div>
                  <label className="block text-[11px] font-black text-slate-500 mb-1.5">
                    {category === "service" ? "شرح تخصصی خدمات، توانمندی‌ها و تعهدات:" : "مشخصات فنی بار، آنالیز شیمیایی و فیزیکی، نحوه تسویه:"}
                  </label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder={category === "service" ? "مثال: ارائه خدمات ممیزی انبارها، تهیه گزارشات قیمت تمام شده منطبق با قوانین سازمان مالیاتی کشور به همراه گواهی تضمین کیفیت عملکرد..." : "مثال: محصول با گرید آزمایشگاهی استاندارد و مدارک COA معتبر، حداقل خرید ۵ تن، تحویل روی جک خریدار در محل کارخانه..."}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600 resize-none transition-colors"
                  />
                </div>

                {/* Special Escrow Brokerage Request Checkbox */}
                <div className="bg-amber-50/40 border border-amber-100/60 rounded-2xl p-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={isSpecialRequested}
                      onChange={(e) => setIsSpecialRequested(e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-600 cursor-pointer"
                    />
                    <span className="text-[10px] font-black text-amber-900">درخواست مشاوره و نظارت کارگزار اختصاصی معامله (عقد قرارداد امن)</span>
                  </label>
                  {isSpecialRequested && (
                    <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="block text-[9px] font-black text-amber-700 mb-1">توضیحات خاص جهت هماهنگی ناظر پلتفرم:</label>
                      <textarea
                        value={specialMessage}
                        onChange={(e) => setSpecialMessage(e.target.value)}
                        placeholder="شرایط پرداختی مدنظر یا توضیحات تکمیلی بابت ضمانت‌نامه‌های مورد نیاز..."
                        rows={2}
                        className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-800 outline-none focus:border-amber-500 resize-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Submission Action Buttons */}
              <div className="pt-4 border-t border-slate-150 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black cursor-pointer transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/15"
                >
                  <FileText size={14} />
                  <span>ثبت و ارسال به صف بررسی ادمین</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    );
  }
}
