import { ShoppingCart, User, Search, Package, Menu, Presentation, Building2, LogOut, ShieldAlert, Sun, Moon, Globe, Award, Sparkles, X, ShoppingBag, Wand2, Compass, BookOpen, Truck, FileText, Download, Factory, ShieldCheck, MessageSquare, Home, Newspaper, GraduationCap, Headphones, Info, PhoneCall, Megaphone, TrendingDown, Lightbulb, Pin, MapPin, CheckCircle2, ChevronLeft, ChevronDown, RefreshCw, Flame, ArrowLeftRight, Repeat, ExternalLink } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { translations, Language } from "../lib/translations";
import DastavvalLogo from "./DastavvalLogo";
import SpecialPriceBagIcon from "./SpecialPriceBagIcon";
import SiteFeedbackModal from "./SiteFeedbackModal";

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  appMode: 'presentation' | 'portal';
  onModeChange: (mode: 'presentation' | 'portal') => void;
  user: { name: string; email: string; role: 'customer' | 'agent' | 'marketer' | 'factory' | 'importer' | 'supplier' | 'representative' | 'leader' | 'admin' | 'user' | 'ad_poster'; company?: string; phone?: string; mobile?: string; city?: string; province?: string } | null;
  onAuthClick: () => void;
  onLogout: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  theme: 'light' | 'dark' | 'classic';
  onThemeChange: (theme: 'light' | 'dark' | 'classic') => void;
  
  // Custom added elements
  interfaceMode: 'simple' | 'advanced';
  onInterfaceModeChange: (mode: 'simple' | 'advanced') => void;
  userBadge: 'bronze' | 'silver' | 'gold' | 'vip' | 'admin';
  onUserBadgeChange: (badge: 'bronze' | 'silver' | 'gold' | 'vip' | 'admin') => void;
  themeColor: string; // 'emerald' | 'indigo' | 'amber' | 'sky' | 'violet'
  onMenuClick?: () => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  appName?: string;
  appSub?: string;
  logoUrl?: string;
  mascotUrl?: string;
  topAnnouncement?: string;
  showTopAnnouncement?: boolean;
  onOpenAnnouncementModal?: () => void;
  hqAddress?: string;
  supportPhone?: string;
  hideHqAddress?: boolean;
  hideSupportPhone?: boolean;
  onOpenCatalog?: () => void;
  onOpenPwaModal?: () => void;
  onOpenCPanelWizard?: () => void;
  onOpenGapGpt?: () => void;
  b2bConfig?: any;
  selectedCity?: string;
  onCityChange?: (city: string) => void;
  onManualSync?: () => void;
  isSyncingData?: boolean;
  onNavigateToBillboardSubTab?: (subTab: 'floor_deals' | 'barter_hall' | 'ad_poster_panel') => void;
}

const toPersianNum = (num: number | string) => {
  if (num === undefined || num === null) return "";
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num
    .toString()
    .replace(/\d/g, (x) => farsiDigits[parseInt(x)]);
};

export default function Navbar({ 
  cartCount, 
  onCartClick, 
  searchQuery, 
  onSearchChange, 
  appMode, 
  onModeChange,
  user,
  onAuthClick,
  onLogout,
  language,
  onLanguageChange,
  theme,
  onThemeChange,
  interfaceMode,
  onInterfaceModeChange,
  userBadge,
  onUserBadgeChange,
  themeColor,
  onMenuClick,
  activeTab,
  setActiveTab,
  appName,
  appSub,
  logoUrl,
  mascotUrl,
  topAnnouncement = "",
  showTopAnnouncement = false,
  onOpenAnnouncementModal,
  hqAddress,
  supportPhone,
  hideHqAddress = false,
  hideSupportPhone = false,
  onOpenCatalog,
  onOpenPwaModal,
  onOpenCPanelWizard,
  onOpenGapGpt,
  b2bConfig,
  selectedCity: propSelectedCity,
  onCityChange,
  onManualSync,
  isSyncingData = false,
  onNavigateToBillboardSubTab,
}: NavbarProps) {
  const t = translations[language] || translations.fa;
  const isRtl = language === "fa" || language === "ar";

  const [localCity, setLocalCity] = useState(() => localStorage.getItem("dastavval_user_city") || "تهران");
  const selectedCity = propSelectedCity || localCity;
  const [activeProvince, setActiveProvince] = useState(() => localStorage.getItem("dastavval_user_province") || "تهران");
  const [showCityModal, setShowCityModal] = useState(false);

  // Sync city/province with user profile if logged in
  useEffect(() => {
    if (user && user.city) {
      setLocalCity(user.city);
      if (user.province) {
        setActiveProvince(user.province);
      }
    }
  }, [user]);

  // Sync with prop changes
  useEffect(() => {
    if (propSelectedCity) {
      setLocalCity(propSelectedCity);
    }
  }, [propSelectedCity]);

  const PROVINCE_CITIES_MAP = [
    { province: "تهران", cities: ["تهران", "شهریار", "اسلامشهر", "ملارد", "قدس", "پاکدشت", "ری", "ورامین", "قرچک", "اندیشه", "رباط‌کریم", "بومهن", "پردیس", "دماوند", "فیروزکوه"] },
    { province: "البرز", cities: ["کرج", "فردیس", "کمال‌شهر", "نظرآباد", "محمدشهر", "هشتگرد", "طالقان"] },
    { province: "اصفهان", cities: ["اصفهان", "کاشان", "خمینی‌شهر", "نجف‌آباد", "شاهین‌شهر", "شهرضا", "فولادشهر", "مبارکه", "آران و بیدگل"] },
    { province: "خراسان رضوی", cities: ["مشهد", "نیشابور", "سبزوار", "تربت حیدریه", "قوچان", "کاشمر", "تربت جام", "تایباد", "سرخس", "گناباد"] },
    { province: "فارس", cities: ["شیراز", "مرودشت", "جهرم", "فسا", "کازرون", "صدرا", "لارستان", "فیروزآباد", "داراب", "ممسنی", "آباده", "نی‌ریز"] },
    { province: "آذربایجان شرقی", cities: ["تبریز", "مراغه", "مرند", "میانه", "اهر", "بناب", "شبستر", "جلفا", "ملکان"] },
    { province: "آذربایجان غربی", cities: ["ارومیه", "خوی", "بوکان", "مهاباد", "میاندوآب", "سلماس", "پیرانشهر", "نقده"] },
    { province: "مازندران", cities: ["ساری", "بابل", "آمل", "قائم‌شهر", "بهشهر", "چالوس", "تنکابن", "بابلسر", "نوشهر", "رامسر", "محمودآباد"] },
    { province: "گیلان", cities: ["رشت", "بندر انزلی", "لاهیجان", "لنگرود", "تالش", "آستارا", "صومعه‌سرا", "رودسر", "فومن"] },
    { province: "خوزستان", cities: ["اهواز", "دزفول", "آبادان", "ماشهر", "خرمشهر", "اندیمشک", "ایذه", "بهبهان", "شوشتر", "شوش", "مسجدسلیمان", "امیدیه"] },
    { province: "هرمزگان", cities: ["بندرعباس", "میناب", "دهبارز", "قشم", "کیش", "بندرلنگه", "حاجی‌آباد", "جاسک"] },
    { province: "کرمان", cities: ["کرمان", "سیرجان", "رفسنجان", "جیرفت", "بم", "زرند", "کهنوج", "شهربابک"] },
    { province: "کردستان", cities: ["سنندج", "سقز", "مریوان", "بانه", "قروه", "بیجار", "کامیاران", "دیواندره"] },
    { province: "کرمانشاه", cities: ["کرمانشاه", "اسلام‌آباد غرب", "کنگاور", "جوانرود", "سنقر", "هرسین", "سرپل ذهاب"] },
    { province: "گلستان", cities: ["گرگان", "گنبد کاووس", "بندر ترکمن", "علی‌آباد کتول", "آزادشهر", "آق‌قلا", "کلاله"] },
    { province: "لرستان", cities: ["خرم‌آباد", "بروجرد", "دورود", "کوهدشت", "دلفان", "الیگودرز", "الشتر", "پلدختر"] },
    { province: "همدان", cities: ["همدان", "ملایر", "نهاوند", "تویسرکان", "اسدآباد", "بهار", "کبودرآهنگ"] },
    { province: "یزد", cities: ["یزد", "میبد", "اردکان", "بافق", "مهریز", "ابرکوه"] },
    { province: "مرکزی", cities: ["اراک", "ساوه", "خمین", "محلات", "دلیجان", "شازند", "تفریش"] },
    { province: "قم", cities: ["قم", "قنوات", "جعفریه"] },
    { province: "قزوین", cities: ["قزوین", "الوند", "محمدیه", "تاکستان", "آبیک", "اقبالیه"] },
    { province: "اردبیل", cities: ["اردبیل", "پارس‌آباد", "مشگین‌شهر", "خلخال", "گرمی", "بیله‌سوار"] },
    { province: "بوشهر", cities: ["بوشهر", "دشتستان", "برازجان", "کنگان", "گناوه", "عسلویه", "جم", "دیر"] },
    { province: "سیستان و بلوچستان", cities: ["زاهدان", "زابل", "ایرانشهر", "چابهار", "سراوان", "خاش", "نیک‌شهر", "بمپور"] },
    { province: "چهارمحال و بختیاری", cities: ["شهرکرد", "بروجن", "لردگان", "فرخ‌شهر", "فارسان"] },
    { province: "خراسان جنوبی", cities: ["بیرجند", "قائن", "طبس", "فردوس", "نهبندان"] },
    { province: "خراسان شمالی", cities: ["بجنورد", "شیروان", "اسفراین", "آشخانه", "جاجرم"] },
    { province: "سمنان", cities: ["سمنان", "شاهرود", "دامغان", "گرمسار", "مهدیشهر"] },
    { province: "ایلام", cities: ["ایلام", "دهلران", "ایوان", "آبدانان", "مهران", "دره‌شهر"] },
    { province: "کهگیلویه و بویراحمد", cities: ["یاسوج", "دوگنبدان", "دهدشت", "لیکک"] },
    { province: "زنجان", cities: ["زنجان", "ابهر", "خرمدره", "قیدار", "طارم"] }
  ];

  const handleSelectCity = (city: string, province: string) => {
    localStorage.setItem("dastavval_user_city", city);
    localStorage.setItem("dastavval_user_province", province);
    if (onCityChange) {
      onCityChange(city);
    } else {
      setLocalCity(city);
    }
    window.dispatchEvent(new CustomEvent("dastavval-city-changed", { detail: { city, province } }));
    setShowCityModal(false);
  };

  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isAnnouncementDismissed, setIsAnnouncementDismissed] = useState(false);

  const languagesList: Array<{ code: Language; label: string; flag: string }> = [
    { code: "fa", label: "فارسی", flag: "🇮🇷" },
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "ar", label: "العربية", flag: "🇸🇦" },
    { code: "ru", label: "Русский", flag: "🇷🇺" },
  ];

  // Dynamic Theme Color helpers
  const colorMap: Record<string, {
    bg: string;
    text: string;
    border: string;
    ring: string;
    badgeBg: string;
  }> = {
    emerald: {
      bg: "bg-emerald-600 hover",
      text: "text-emerald-600",
      border: "border-emerald-200",
      ring: "focus",
      badgeBg: "bg-emerald-600 text-white"
    },
    teal: {
      bg: "bg-teal-600 hover",
      text: "text-teal-600",
      border: "border-teal-200",
      ring: "focus",
      badgeBg: "bg-teal-50 text-teal-700"
    },
    indigo: {
      bg: "bg-[#10b981] hover:bg-[#059669]",
      text: "text-[#10b981]",
      border: "border-emerald-200",
      ring: "focus",
      badgeBg: "bg-emerald-600 text-white"
    },
    amber: {
      bg: "bg-emerald-600 hover:bg-emerald-700",
      text: "text-emerald-600",
      border: "border-emerald-200",
      ring: "focus",
      badgeBg: "bg-emerald-600 text-white"
    },
    sky: {
      bg: "bg-emerald-600 hover",
      text: "text-emerald-600",
      border: "border-sky-200",
      ring: "focus",
      badgeBg: "bg-sky-50 text-sky-700"
    },
    violet: {
      bg: "bg-violet-600 hover",
      text: "text-violet-600",
      border: "border-violet-200",
      ring: "focus",
      badgeBg: "bg-violet-50 text-violet-700"
    }
  };

  const activeColor = colorMap[themeColor] || colorMap.emerald;

  // Render correct badge label
  const getBadgeTranslation = (badgeKey: string) => {
    switch(badgeKey) {
      case 'bronze': return t.badgeBronze;
      case 'silver': return t.badgeSilver;
      case 'gold': return t.badgeGold;
      case 'vip': return t.badgeVIP;
      case 'admin': return t.badgeAdmin;
      default: return t.badgeBronze;
    }
  };

  const getBadgeColorClass = (badgeKey: string) => {
    switch(badgeKey) {
      case 'bronze': return "bg-stone-100 text-stone-800 border border-stone-200/50";
      case 'silver': return "bg-slate-100 text-emerald-800 border border-slate-200/40";
      case 'gold': return "bg-emerald-600 text-white border border-emerald-200/40";
      case 'vip': return "bg-purple-100 text-purple-800 border border-purple-200/40 animate-pulse";
      case 'admin': return "bg-emerald-100 text-rose-800 border border-emerald-200/40";
      default: return "";
    }
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [mascotFailed, setMascotFailed] = useState(false);

  // Announcement Channel States
  const [isChannelOpen, setIsChannelOpen] = useState(false);
  const [channelPosts, setChannelPosts] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadChannelPosts = () => {
    try {
      const saved = localStorage.getItem("dastavval_announcements");
      let posts = [];
      if (saved) {
        posts = JSON.parse(saved);
      } else {
        // Empty by default for production
        posts = [];
        localStorage.setItem("dastavval_announcements", JSON.stringify(posts));
      }

      // Sort: pinned first, then preserve existing ordering (which is newest first)
      const sorted = [...posts].sort((a: any, b: any) => {
        const aPinned = !!a.pinned;
        const bPinned = !!b.pinned;
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return 0;
      });

      setChannelPosts(sorted);

      // Calculate unread count
      const lastReadId = localStorage.getItem("dastavval_last_read_announcement") || "";
      if (posts.length > 0) {
        if (!lastReadId) {
          setUnreadCount(posts.length);
        } else {
          const index = posts.findIndex(p => p.id === lastReadId);
          if (index !== -1) {
            setUnreadCount(index);
          } else {
            setUnreadCount(posts.length);
          }
        }
      } else {
        setUnreadCount(0);
      }
    } catch (err) {
      console.warn("Could not load channel posts:", err);
    }
  };

  useEffect(() => {
    loadChannelPosts();

    const handleUpdate = () => {
      loadChannelPosts();
    };

    window.addEventListener("dastavval_announcements_updated", handleUpdate);
    return () => {
      window.removeEventListener("dastavval_announcements_updated", handleUpdate);
    };
  }, []);

  const handleOpenChannel = () => {
    setIsChannelOpen(true);
    setUnreadCount(0);
    if (channelPosts.length > 0) {
      localStorage.setItem("dastavval_last_read_announcement", channelPosts[0].id);
    }
  };

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  useEffect(() => {
    const handleOpenPicker = () => {
      setShowCityModal(true);
    };
    window.addEventListener("open-city-picker-modal-from-banner", handleOpenPicker);
    return () => {
      window.removeEventListener("open-city-picker-modal-from-banner", handleOpenPicker);
    };
  }, []);

  const navItems = [
    { id: 'presentation', label: t.home, icon: <Home size={18} className="text-slate-500 transition-colors" /> },
    { id: 'order', label: t.wholesaleBuy, icon: <ShoppingBag size={18} className="text-slate-500 transition-colors" /> },
    { id: 'billboard', label: "کف بازار", icon: <SpecialPriceBagIcon size={18} animated={true} plain={true} /> },
    { id: 'factories', label: "کارخانجات", icon: <Building2 size={18} className="text-slate-500 transition-colors" /> },
    { id: 'admin', label: "حساب کاربری", icon: <User size={18} className="text-slate-500 transition-colors" /> },
  ];

  const handleNavClick = (id: string) => {
    if (id === 'admin' || id === 'user' || id === 'profile') {
      if (!user) {
        onAuthClick?.();
        return;
      }
      if (id === 'admin' && user.role !== 'admin') {
        id = 'user';
      }
    }
    if (id === 'barter') {
      setActiveTab?.('factories' as any);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("change-factories-subtab", { detail: { subTab: 'barter' } }));
      }, 50);
    } else if (id === 'ad_poster_panel') {
      setActiveTab?.('billboard' as any);
      onNavigateToBillboardSubTab?.('ad_poster_panel');
    } else if (id === 'billboard') {
      setActiveTab?.('billboard' as any);
      onNavigateToBillboardSubTab?.('floor_deals');
    } else if (setActiveTab) {
      setActiveTab(id as any);
    }
    setIsMobileMenuOpen(false);
  };

  const rubikaUrl = "https://rubika.ir/dastavval_com";
  const telegramUrl = b2bConfig?.telegramChannelUrl || "https://t.me/dastavval_com";
  const whatsappUrl = b2bConfig?.whatsappGroupUrl || "https://chat.whatsapp.com/dastavval_com";
  const instagramUrl = b2bConfig?.instagramPageUrl || "https://instagram.com/dastavval_com";

  const showTopSocialBar = b2bConfig?.showTopSocialBar === true;

  return (
    <>
      <nav className="sticky top-0 z-50 transition-all duration-300 bg-white/80 border-b border-slate-200/50 shadow-sm text-slate-900 backdrop-blur-xl" dir={isRtl ? "rtl" : "ltr"}>
        {/* Top Social Channels Bar */}
        {showTopSocialBar && (
          <div className="bg-white text-slate-600 text-[10px] font-bold py-1 px-3 sm:px-4 border-b border-slate-100 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shadow-xs">
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <span className="text-[10px] text-slate-400 font-black hidden sm:inline-block">شبکه‌های رسمی:</span>
              
              {/* Rubika Button */}
              <a
                href={rubikaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-purple-700 text-[10px] font-black transition-all flex items-center gap-1 shadow-sm shrink-0"
                title="عضویت در کانال روبیکا"
              >
                <span>روبیکا</span>
              </a>

              {/* Instagram Button */}
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-pink-700 text-[10px] font-black transition-all flex items-center gap-1 shadow-sm shrink-0"
                title="عضویت در اینستاگرام دست اول"
              >
                <span>اینستاگرام</span>
              </a>

              {/* WhatsApp Button */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-emerald-700 text-[10px] font-black transition-all flex items-center gap-1 shadow-sm shrink-0"
                title="گروه واتساپ"
              >
                <span>واتساپ</span>
              </a>

              {/* Telegram Button */}
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-0.5 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:opacity-90 text-white text-[10px] font-black transition-all flex items-center gap-1 shadow-sm shrink-0"
                title="کانال تلگرام"
              >
                <span>تلگرام</span>
              </a>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0 mr-auto">
              <button
                onClick={() => onOpenPwaModal?.()}
                className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer"
              >
                <Download size={10} />
                <span>نصب اپلیکیشن</span>
              </button>
            </div>
          </div>
        )}

        {/* Top Accent Bar */}
        <div className="h-0.5 w-full bg-gradient-to-r from-amber-400 via-emerald-500 to-emerald-500 opacity-80" />
        
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-11 sm:h-13 md:h-14">
            
            {/* Logo and Brand Title (Ultra Compact) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-1 hover text-slate-500 hover rounded-lg transition-colors cursor-pointer"
                title="مشاهده اطلاعات پلتفرم و تضمین‌ها"
              >
                <Menu size={18} />
              </button>
              <button 
                onClick={() => {
                  onModeChange('presentation');
                  setActiveTab?.('presentation');
                }}
                className="flex items-center gap-2 text-right group focus:outline-none cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                    <DastavvalLogo size={32} showText={false} logoUrl={logoUrl} />
                  </div>
                  <div className="flex flex-col text-right">
                    <span className={`text-xs sm:text-sm font-black tracking-tight leading-none text-slate-900 transition-colors`}>
                      {appName || t.appName}
                    </span>
                  </div>
                </div>
              </button>
            </div>

            {/* Desktop Center Navigation Links - Refined & 100% Responsive Single-Row Dock */}
            <div className="hidden lg:flex items-center justify-center gap-1.5 flex-1 max-w-2xl mx-3 bg-slate-50/80 p-1 rounded-2xl border border-slate-200/60 shadow-2xs">
              <button
                onClick={() => {
                  onModeChange('presentation');
                  setActiveTab?.('presentation');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'presentation'
                    ? "bg-white text-emerald-700 shadow-sm border border-slate-200 scale-[1.02]"
                    : "text-slate-600 hover:text-slate-950 hover:bg-white/60"
                }`}
              >
                <Home size={15} />
                <span>{t.home}</span>
              </button>

              <button
                onClick={() => {
                  onModeChange('portal');
                  setActiveTab?.('order');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'order'
                    ? "bg-white text-emerald-700 shadow-sm border border-slate-200 scale-[1.02]"
                    : "text-slate-600 hover:text-slate-950 hover:bg-white/60"
                }`}
              >
                <ShoppingBag size={15} />
                <span>{t.wholesaleBuy}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab?.('billboard');
                }}
                className={`relative px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                  activeTab === 'billboard'
                    ? "bg-amber-400 text-slate-950 shadow-sm border-amber-500 ring-1 ring-amber-400/40"
                    : "bg-emerald-50/70 text-emerald-950 border-emerald-200/70 hover:bg-emerald-100/80"
                }`}
              >
                <SpecialPriceBagIcon size={16} animated={true} className="text-slate-950 drop-shadow-xs" />
                <span className="tracking-tight">کفِ بازار</span>
                <span className="bg-slate-950/10 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap">
                  حراج 🔥
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab?.('factories');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'factories'
                    ? "bg-white text-emerald-700 shadow-sm border border-slate-200 scale-[1.02]"
                    : "text-slate-600 hover:text-slate-950 hover:bg-white/60"
                }`}
              >
                <Building2 size={15} />
                <span>کارخانجات</span>
              </button>

              {/* More / Additional Features Dropdown */}
              <div className="relative" ref={moreMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer flex items-center gap-1.5 border ${
                    isMoreMenuOpen || ['competition', 'weekly-schedule', 'news'].includes(activeTab || '')
                      ? "bg-emerald-600 text-white shadow-sm border-emerald-600"
                      : "bg-white/80 text-slate-700 border-slate-200 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  <Sparkles size={14} className={isMoreMenuOpen ? "text-amber-300" : "text-emerald-600"} />
                  <span>سایر امکانات</span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${isMoreMenuOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {isMoreMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 text-right overflow-hidden"
                    >
                      <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 border-b border-slate-100">
                        تالارها و سرویس‌های تخصصی
                      </div>

                      {/* Health Apple Showcase */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          onModeChange('presentation');
                          setActiveTab?.('presentation');
                          setTimeout(() => {
                            const showcaseEl = document.querySelector('.health-showcase');
                            if (showcaseEl) showcaseEl.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        }}
                        className="w-full px-3.5 py-2 text-right text-xs font-black text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors flex items-center gap-2.5 cursor-pointer"
                      >
                        <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm shrink-0">🍏</span>
                        <div className="flex flex-col">
                          <span>محصولات سیب سلامت</span>
                          <span className="text-[10px] text-slate-400 font-medium">طبیعی، ارگانیک و سلامت‌محور</span>
                        </div>
                      </button>

                      {/* Group Buying Basket */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          setActiveTab?.('weekly-schedule');
                        }}
                        className="w-full px-3.5 py-2 text-right text-xs font-black text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors flex items-center gap-2.5 cursor-pointer"
                      >
                        <Flame size={16} className="text-rose-500 shrink-0" />
                        <div className="flex flex-col">
                          <span>سبد خرید گروهی (مهر)</span>
                          <span className="text-[10px] text-slate-400 font-medium">تخفیف ویژه سفارش تجمیعی</span>
                        </div>
                      </button>

                      {/* Barter */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          setActiveTab?.('factories');
                          setTimeout(() => {
                            window.dispatchEvent(new CustomEvent("change-factories-subtab", { detail: { subTab: 'barter' } }));
                          }, 50);
                        }}
                        className="w-full px-3.5 py-2 text-right text-xs font-black text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition-colors flex items-center gap-2.5 cursor-pointer"
                      >
                        <ArrowLeftRight size={16} className="text-amber-600 shrink-0" />
                        <div className="flex flex-col">
                          <span>تالار تهاتر و معاوضه</span>
                          <span className="text-[10px] text-slate-400 font-medium">تبادل کالا، بار و تجهیزات</span>
                        </div>
                      </button>

                      {/* Ad Poster */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          setActiveTab?.('billboard');
                          onNavigateToBillboardSubTab?.('ad_poster_panel');
                        }}
                        className="w-full px-3.5 py-2 text-right text-xs font-black text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors flex items-center gap-2.5 cursor-pointer"
                      >
                        <Megaphone size={16} className="text-emerald-600 shrink-0" />
                        <div className="flex flex-col">
                          <span>ثبت آگهی جدید</span>
                          <span className="text-[10px] text-slate-400 font-medium">پنل آگهی‌دهندگان و بنکداران</span>
                        </div>
                      </button>

                      {/* Competition */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          setActiveTab?.('competition');
                        }}
                        className="w-full px-3.5 py-2 text-right text-xs font-black text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors flex items-center gap-2.5 cursor-pointer"
                      >
                        <Award size={16} className="text-amber-500 shrink-0" />
                        <div className="flex flex-col">
                          <span>رقابت و رتبه‌بندی</span>
                          <span className="text-[10px] text-slate-400 font-medium">امتیاز فعالان و نمایندگان برتر</span>
                        </div>
                      </button>

                      {/* Education / Guide */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          setActiveTab?.('news');
                          setTimeout(() => {
                            window.dispatchEvent(new CustomEvent("change-news-subtab", { detail: { subTab: 'education' } }));
                          }, 50);
                        }}
                        className="w-full px-3.5 py-2 text-right text-xs font-black text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors flex items-center gap-2.5 cursor-pointer"
                      >
                        <GraduationCap size={16} className="text-emerald-600 shrink-0" />
                        <div className="flex flex-col">
                          <span>راهنمای خرید و آموزش</span>
                          <span className="text-[10px] text-slate-400 font-medium">نحوه ثبت سفارش و شرایط تسویه</span>
                        </div>
                      </button>

                      <div className="my-1 border-t border-slate-100" />

                      {/* GapGPT Assistant */}
                      {onOpenGapGpt && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            onOpenGapGpt();
                          }}
                          className="w-full px-3.5 py-2 text-right text-xs font-black text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors flex items-center gap-2.5 cursor-pointer"
                        >
                          <Sparkles size={16} className="text-amber-500 shrink-0" />
                          <span>دستیار هوشمند GapGPT</span>
                        </button>
                      )}

                      {/* PDF Catalog */}
                      {onOpenCatalog && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            onOpenCatalog();
                          }}
                          className="w-full px-3.5 py-2 text-right text-xs font-black text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors flex items-center gap-2.5 cursor-pointer"
                        >
                          <FileText size={16} className="text-emerald-600 shrink-0" />
                          <span>دانلود کاتالوگ جامع (PDF)</span>
                        </button>
                      )}

                      {/* PWA Install */}
                      {onOpenPwaModal && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            onOpenPwaModal();
                          }}
                          className="w-full px-3.5 py-2 text-right text-xs font-black text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors flex items-center gap-2.5 cursor-pointer"
                        >
                          <Download size={16} className="text-emerald-600 shrink-0" />
                          <span>نصب وب‌اپلیکیشن PWA</span>
                        </button>
                      )}

                      {/* cPanel Wizard */}
                      {onOpenCPanelWizard && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            onOpenCPanelWizard();
                          }}
                          className="w-full px-3.5 py-2 text-right text-xs font-black text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors flex items-center gap-2.5 cursor-pointer"
                        >
                          <Sparkles size={16} className="text-emerald-500 shrink-0" />
                          <span>راه‌اندازی cPanel و SQL</span>
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Admin Button (Visible only to admin) */}
              {user?.role === 'admin' && (
                <button
                  onClick={() => setActiveTab?.('admin')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer flex items-center gap-1.5 border ${
                    activeTab === 'admin'
                      ? "bg-rose-600 text-white shadow-sm border-rose-600"
                      : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                  }`}
                >
                  <ShieldAlert size={14} />
                  <span>مدیریت</span>
                </button>
              )}
            </div>

            {/* Right Side Control Bar */}
            <div className="flex items-center gap-2">
              {/* Profile Badge (Desktop Only) */}
              {user ? (
                <div className="hidden lg:flex items-center gap-2">
                  <div 
                    onClick={() => handleNavClick(user?.role === 'admin' ? 'admin' : 'profile')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black cursor-pointer hover:opacity-80 transition-all ${getBadgeColorClass(userBadge)}`}
                  >
                    <Award size={12} />
                    <span>{getBadgeTranslation(userBadge)}</span>
                  </div>
                  <button 
                    onClick={onLogout}
                    className="p-2 text-emerald-500 hover rounded-xl transition-all cursor-pointer"
                    title="خروج از حساب"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onAuthClick}
                  className="hidden lg:flex items-center gap-2 px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-black hover transition-all cursor-pointer"
                >
                  <User size={14} />
                  حساب کاربری
                </button>
              )}

              {/* City Selection Badge */}
              <button
                onClick={() => setShowCityModal(true)}
                className="flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] sm:text-xs font-black border border-slate-200 transition-all cursor-pointer shadow-2xs h-10"
                title="انتخاب شهر شما برای بارگیری و عاملیت‌ها"
              >
                <MapPin size={15} className="text-emerald-600 animate-bounce" />
                <span className="hidden sm:inline">شهر:</span>
                <span className="text-slate-900 font-black">{selectedCity}</span>
              </button>

              {/* Official Announcement Channel Icon (Megaphone with unread count) */}
              <button
                onClick={handleOpenChannel}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/80 text-slate-700 flex items-center justify-center relative transition-all cursor-pointer shadow-2xs shrink-0"
                title="کانال اطلاع‌رسانی رسمی دست اول"
              >
                <Megaphone size={16} className="text-emerald-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Cart Button with Soft Pulse Animation */}
              <motion.button 
                key={`cart-pulse-${cartCount}`}
                initial={cartCount > 0 ? { scale: 1 } : false}
                animate={cartCount > 0 ? { 
                  scale: [1, 1.1, 1],
                  backgroundColor: ["#f1f5f9", "#ecfdf5", "#f1f5f9"],
                  boxShadow: ["0 0 0px rgba(16, 185, 129, 0)", "0 0 15px rgba(16, 185, 129, 0.2)", "0 0 0px rgba(16, 185, 129, 0)"]
                } : {}}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                onClick={onCartClick} 
                className="p-2 sm:px-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl relative hover:scale-105 transition-transform cursor-pointer flex items-center gap-1.5 border border-slate-200"
                aria-label="View Cart"
                title="مشاهده سبد خرید"
              >
                <ShoppingCart size={18} className={cartCount > 0 ? "text-emerald-600" : ""} />
                <span className="text-xs font-black hidden xs:inline">سبد خرید</span>
                <AnimatePresence mode="popLayout">
                  {cartCount > 0 && (
                    <motion.span 
                      key={`cart-badge-${cartCount}`}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className="w-4.5 h-4.5 bg-emerald-600 text-white text-[10px] rounded-full flex items-center justify-center font-black shadow-xs"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>


            </div>
          </div>
        </div>
      </nav>

      {/* Floating Bottom App Navigation Bar for Mobile Viewports (Ultra-Creative, Clean White, Frosted Glass, Animated Pill) */}
      <div className="lg:hidden fixed bottom-2 left-2.5 right-2.5 z-50 bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-[0_12px_32px_rgba(0,0,0,0.1)] rounded-3xl p-1.5 transition-all duration-300">
        <div className="flex justify-around items-center h-14 relative">
          {navItems.map((item, idx) => {
            const isActive = activeTab === item.id;
            if (item.id === 'billboard') {
              return (
                <button
                  key={`bottom-nav-${item.id}-${idx}`}
                  onClick={() => handleNavClick(item.id)}
                  className="flex-1 flex flex-col items-center justify-center py-1 transition-all relative cursor-pointer group"
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeMobileIndicator"
                      className="absolute inset-y-0 inset-x-0.5 sm:inset-x-1 bg-gradient-to-r from-rose-500/15 via-rose-400/20 to-rose-500/15 border border-rose-300/60 rounded-2xl z-0 shadow-md shadow-rose-500/10 ring-2 ring-rose-400/20 backdrop-blur-xs"
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    />
                  )}
                  <div className={`relative z-10 flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                    isActive 
                      ? "text-rose-600 font-black scale-105" 
                      : "text-rose-500 hover:text-rose-700"
                  }`}>
                    <span className="relative flex items-center justify-center">
                      <SpecialPriceBagIcon size={18} animated={true} plain={true} />
                    </span>
                    <span className="text-[9.5px] font-black tracking-tighter">
                      کف بازار
                    </span>
                  </div>
                </button>
              );
            }
            if (item.id === 'news') {
              return (
                <button
                  key={`bottom-nav-${item.id}-${idx}`}
                  onClick={() => handleNavClick(item.id)}
                  className="flex-1 flex flex-col items-center justify-center py-1 transition-all relative cursor-pointer"
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeMobileIndicator"
                      className="absolute inset-y-0 inset-x-0.5 sm:inset-x-1 bg-gradient-to-r from-emerald-500/15 via-teal-500/20 to-emerald-500/15 border border-emerald-400/50 rounded-2xl z-0 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-400/20 backdrop-blur-xs"
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    />
                  )}
                  <div className={`relative z-10 flex flex-col items-center justify-center gap-0.5 ${isActive ? "text-emerald-800 font-black scale-105" : "text-slate-600 hover:text-slate-900"}`}>
                    <span className="p-1">
                      <Compass size={20} />
                    </span>
                    <span className="text-[9.5px] font-bold tracking-tight">
                      {item.label}
                    </span>
                  </div>
                </button>
              );
            }
            if (item.id === 'ai') {
              return (
                <button
                  key={`bottom-nav-${item.id}-${idx}`}
                  onClick={() => handleNavClick(item.id)}
                  className="flex-1 flex flex-col items-center justify-center py-1 transition-all relative cursor-pointer"
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeMobileIndicator"
                      className="absolute inset-y-0 inset-x-0.5 sm:inset-x-1 bg-gradient-to-r from-amber-500/15 via-orange-400/20 to-amber-500/15 border border-amber-400/50 rounded-2xl z-0 shadow-md shadow-amber-500/10 ring-2 ring-amber-400/20 backdrop-blur-xs"
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    />
                  )}
                  <div className={`relative z-10 flex flex-col items-center justify-center gap-0.5 ${isActive ? "text-amber-700 font-black scale-105" : "text-slate-600 hover:text-slate-900"}`}>
                    <span className="p-1">
                      <Wand2 size={20} />
                    </span>
                    <span className="text-[9.5px] font-bold tracking-tight">
                      {item.label}
                    </span>
                  </div>
                </button>
              );
            }
            return (
              <button
                key={`bottom-nav-${item.id}-${idx}`}
                onClick={() => handleNavClick(item.id)}
                className="flex-1 flex flex-col items-center justify-center py-1 transition-all relative cursor-pointer"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeMobileIndicator"
                    className="absolute inset-y-0 inset-x-0.5 sm:inset-x-1 bg-gradient-to-r from-emerald-500/15 via-teal-500/20 to-emerald-500/15 border border-emerald-400/50 rounded-2xl z-0 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-400/20 backdrop-blur-xs"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
                <div className={`relative z-10 flex flex-col items-center justify-center gap-0.5 ${isActive ? "text-emerald-800 font-black scale-105" : "text-slate-600 hover:text-slate-900"}`}>
                  <span className="p-1">
                    {item.icon}
                  </span>
                  <span className="text-[9.5px] font-bold tracking-tight">
                    {item.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hamburger Sidebar Drawer (Overlay) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Sliding Drawer */}
            <motion.div 
              initial={{ x: isRtl ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? "100%" : "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className={`fixed top-0 bottom-0 ${isRtl ? 'right-0' : 'left-0'} w-full max-w-xs sm:max-w-sm z-[101] bg-white shadow-2xl overflow-y-auto flex flex-col justify-between`}
              dir={isRtl ? "rtl" : "ltr"}
            >
              <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex justify-between items-center pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-xs">
                      د۱
                    </div>
                    <div>
                      <span className="text-sm font-black text-slate-900 block leading-tight">{appName || "پلتفرم دست اول"}</span>
                      <span className="text-[10px] text-emerald-700 font-bold">توزیع مستقیم کالای کارخانجات</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                    aria-label="بستن منو"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Smart User Profile / Guest Card */}
                {user ? (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
                          {user.name ? user.name.slice(0, 1) : "👤"}
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                            <span>{user.name || "کاربر گرامی"}</span>
                            <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                              {user.role === 'admin' ? "مدیر سامانه" : "خریدار تاییدشده"}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {user.mobile || user.phone || user.email || ""}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                      <button
                        onClick={() => {
                          if (user.role === 'admin') {
                            if (setActiveTab) setActiveTab('admin');
                          } else {
                            if (setActiveTab) setActiveTab('user');
                          }
                          setIsMobileMenuOpen(false);
                        }}
                        className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <User size={13} />
                        <span>{user.role === 'admin' ? "پنل مدیریت" : "حساب کاربری"}</span>
                      </button>

                      <button
                        onClick={() => {
                          onLogout();
                          setIsMobileMenuOpen(false);
                        }}
                        className="py-2 px-3 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-600 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <LogOut size={13} />
                        <span>خروج</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-emerald-50 via-emerald-50/50 to-amber-50/40 border border-emerald-200/80 rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-emerald-600" />
                      <span className="text-xs font-black text-slate-900">خوش آمدید!</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                      برای مشاهده قیمت‌های همکاری کارخانجات، فاکتورها و دریافت تخفیف وارد حساب خود شوید.
                    </p>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onAuthClick?.();
                      }}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <User size={14} />
                      <span>ورود / ثبت‌نام سریع</span>
                    </button>
                  </div>
                )}

                {/* Location & Quick Sync Widget */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setShowCityModal(true);
                    }}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-right transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                      <MapPin size={11} className="text-emerald-600" />
                      <span>شهر پیش‌فرض:</span>
                    </span>
                    <span className="text-xs font-black text-slate-900 mt-1 truncate">
                      {selectedCity || "تبریز"} ✏️
                    </span>
                  </button>

                  {onManualSync ? (
                    <button
                      onClick={() => onManualSync()}
                      disabled={isSyncingData}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-right transition-all cursor-pointer flex flex-col justify-between disabled:opacity-50"
                    >
                      <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                        <RefreshCw size={11} className={`text-emerald-600 ${isSyncingData ? "animate-spin" : ""}`} />
                        <span>همگام‌سازی:</span>
                      </span>
                      <span className="text-xs font-black text-slate-900 mt-1 truncate">
                        {isSyncingData ? "در حال سینک..." : "بروزرسانی زنده ⚡"}
                      </span>
                    </button>
                  ) : (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-right">
                      <span className="text-[9px] text-slate-400 font-bold">وضعیت اتصال:</span>
                      <span className="text-xs font-black text-emerald-700 mt-1 block">آنلاین و فعال 🟢</span>
                    </div>
                  )}
                </div>

                {/* Core Navigation Links */}
                <div className="space-y-1 pt-1">
                  <div className="text-[10px] text-slate-400 font-black px-1 pb-1">بخش‌های اصلی:</div>
                  
                  <button
                    onClick={() => handleNavClick('presentation')}
                    className={`w-full p-2.5 rounded-xl text-xs font-black flex items-center justify-between transition-all cursor-pointer ${
                      activeTab === 'presentation' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Home size={16} className={activeTab === 'presentation' ? 'text-white' : 'text-emerald-600'} />
                      <span>صفحه اصلی و معرفی</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleNavClick('order')}
                    className={`w-full p-2.5 rounded-xl text-xs font-black flex items-center justify-between transition-all cursor-pointer ${
                      activeTab === 'order' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <ShoppingBag size={16} className={activeTab === 'order' ? 'text-white' : 'text-emerald-600'} />
                      <span>سفارش و کاتالوگ خرید عمده</span>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${activeTab === 'order' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                      کف قیمت
                    </span>
                  </button>

                  <button
                    onClick={() => handleNavClick('billboard')}
                    className={`w-full p-2.5 rounded-xl text-xs font-black flex items-center justify-between transition-all cursor-pointer ${
                      activeTab === 'billboard' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <SpecialPriceBagIcon size={16} animated={false} plain={true} />
                      <span>معاملات کف بازار و حراجی</span>
                    </div>
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                      ویژه
                    </span>
                  </button>

                  <button
                    onClick={() => handleNavClick('factories')}
                    className={`w-full p-2.5 rounded-xl text-xs font-black flex items-center justify-between transition-all cursor-pointer ${
                      activeTab === 'factories' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 size={16} className={activeTab === 'factories' ? 'text-white' : 'text-emerald-600'} />
                      <span>کارخانجات و خطوط تولید</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleNavClick('competition')}
                    className={`w-full p-2.5 rounded-xl text-xs font-black flex items-center justify-between transition-all cursor-pointer ${
                      activeTab === 'competition' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Award size={16} className={activeTab === 'competition' ? 'text-white' : 'text-emerald-600'} />
                      <span>لیگ رقابت و رتبه‌بندی</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      if (setActiveTab) setActiveTab('factories');
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent("change-factories-subtab", { detail: { subTab: 'barter' } }));
                      }, 50);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full p-2.5 rounded-xl text-xs font-black flex items-center justify-between text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <ArrowLeftRight size={16} className="text-amber-600" />
                      <span>تالار تهاتر و تبادل بار کارخانجات</span>
                    </div>
                  </button>
                </div>

                {/* Smart Direct Tools */}
                <div className="space-y-1.5 pt-3 border-t border-slate-100">
                  <div className="text-[10px] text-slate-400 font-black px-1 pb-0.5">ابزارها و خدمات سریع:</div>

                  {/* Direct Ticket Trigger */}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (user) {
                        if (user.role === 'admin') {
                          if (setActiveTab) setActiveTab('admin');
                          setTimeout(() => {
                            window.dispatchEvent(new CustomEvent("change-admin-tab", { detail: { tab: 'tickets' } }));
                          }, 50);
                        } else {
                          if (setActiveTab) setActiveTab('user');
                          setTimeout(() => {
                            window.dispatchEvent(new CustomEvent("change-portal-tab", { detail: { tab: 'tickets' } }));
                          }, 50);
                        }
                      } else {
                        onAuthClick?.();
                      }
                    }}
                    className="w-full p-2.5 bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200/80 rounded-xl text-xs font-black text-emerald-900 flex items-center justify-between transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare size={15} className="text-emerald-700" />
                      <span>تیکت پشتیبانی و پیام مستقیم</span>
                    </div>
                    <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-md font-bold">۲۴/۷</span>
                  </button>

                  {/* Catalog PDF */}
                  {onOpenCatalog && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenCatalog();
                      }}
                      className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-black text-slate-800 flex items-center justify-between transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <FileText size={15} className="text-emerald-600" />
                        <span>دریافت لیست قیمت جامع (PDF)</span>
                      </div>
                      <Download size={13} className="text-slate-400" />
                    </button>
                  )}

                  {/* Learning Hub */}
                  <button
                    onClick={() => handleNavClick('learning')}
                    className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-black text-slate-800 flex items-center justify-between transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <GraduationCap size={15} className="text-emerald-600" />
                      <span>راهنمای خرید و تسویه چک</span>
                    </div>
                    <ChevronLeft size={13} className="text-slate-400" />
                  </button>

                  {/* PWA App Install */}
                  {onOpenPwaModal && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenPwaModal();
                      }}
                      className="w-full p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-between transition-all shadow-xs cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Download size={15} className="animate-bounce" />
                        <span>نصب نسخه اپلیکیشن PWA</span>
                      </div>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md">رایگان</span>
                    </button>
                  )}

                  {/* Feedback Modal Trigger */}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsFeedbackModalOpen(true);
                    }}
                    className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Lightbulb size={15} className="text-amber-500" />
                    <span>💡 ثبت ایده، پیشنهاد یا گزارش اشکال</span>
                  </button>
                </div>
              </div>

              {/* Bottom Support & Socials Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
                {/* Direct Call Button */}
                {!hideSupportPhone && (
                  <a
                    href={`tel:${supportPhone || "09044502900"}`}
                    className="w-full py-2.5 px-3 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-black flex items-center justify-between transition-all shadow-3xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <PhoneCall size={14} className="text-emerald-600" />
                      <span>تماس فوری با پشتیبانی:</span>
                    </div>
                    <span className="font-mono font-bold" dir="ltr">{supportPhone || "۰۹۰۴۴۵۰۲۹۰۰"}</span>
                  </a>
                )}

                {/* Social Icons */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400 font-bold">شبکه‌های رسمی دست اول:</span>
                  <div className="flex items-center gap-2">
                    <a
                      href={rubikaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded-lg bg-purple-700 text-white flex items-center justify-center text-[10px] font-black hover:scale-105 transition-transform"
                      title="روبیکا"
                    >
                      روبیکا
                    </a>
                    <a
                      href={telegramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center text-[10px] font-black hover:scale-105 transition-transform"
                      title="تلگرام"
                    >
                      TG
                    </a>
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center text-[10px] font-black hover:scale-105 transition-transform"
                      title="اینستاگرام"
                    >
                      IG
                    </a>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black hover:scale-105 transition-transform"
                      title="واتساپ"
                    >
                      WA
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Announcement Channel Modal */}
      <AnimatePresence>
        {isChannelOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" dir="rtl">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChannelOpen(false)}
              className="absolute inset-0 bg-slate-400/50 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[2.5rem] border border-slate-200/80 w-full max-w-lg shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="bg-white border-b border-slate-100 p-6 flex items-center justify-between relative text-right">
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                    <Megaphone size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-800">کانال رسمی اطلاع‌رسانی دست اول</h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">جدیدترین اخبار، حراجی‌ها و جشنواره‌های مستقیم کارخانجات</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsChannelOpen(false)}
                  className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer relative z-10"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Announcements List */}
              <div className="p-6 overflow-y-auto space-y-5 max-h-[55vh] bg-white custom-scrollbar flex-1 text-right">
                {channelPosts.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 font-bold text-xs space-y-2">
                    <Megaphone size={32} className="mx-auto text-slate-300" />
                    <p dir="rtl">هنوز هیچ اطلاعیه‌ای در کانال منتشر نشده است.</p>
                  </div>
                ) : (
                  channelPosts.map((post, idx) => (
                    <div 
                      key={`channel-post-${post.id || idx}-${idx}`} 
                      className={`bg-white border p-5 shadow-2xs hover:shadow-xs transition-all space-y-3 relative overflow-hidden text-right ${
                        post.pinned
                          ? "border-amber-400 bg-emerald-50/10 ring-2 ring-amber-400/20 rounded-3xl"
                          : idx === 0
                            ? "border-emerald-500 ring-2 ring-emerald-500/10 rounded-3xl"
                            : "border-slate-150 rounded-2xl"
                      }`}
                    >
                      {post.pinned ? (
                        <span className="absolute top-0 left-0 bg-emerald-600 text-white text-[8px] font-black px-2.5 py-1 rounded-br-2xl flex items-center gap-1">
                          <Pin size={8} className="fill-slate-900" />
                          مهم / سنجاق شده
                        </span>
                      ) : idx === 0 ? (
                        <span className="absolute top-0 left-0 bg-emerald-600 text-white text-[8px] font-black px-2.5 py-1 rounded-br-2xl">
                          جدیدترین اطلاعیه
                        </span>
                      ) : null}

                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            post.category === 'urgent' ? 'bg-red-100 text-red-700 border border-red-200/50' :
                            post.category === 'festival' ? 'bg-emerald-100 text-amber-800 border border-emerald-200/50' :
                            post.category === 'system' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200/50' :
                            'bg-slate-100 text-slate-750'
                          }`}>
                            {post.category === 'urgent' ? '🔴 فوری' :
                             post.category === 'festival' ? '🎉 جشنواره' :
                             post.category === 'system' ? '⚙️ سیستمی' :
                             '📣 عمومی'}
                          </span>
                          <h4 className="font-black text-xs text-slate-900 leading-tight flex items-center gap-1.5">
                            {post.pinned && <Pin size={11} className="text-emerald-500 fill-emerald-500" />}
                            {post.title}
                          </h4>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 shrink-0 font-mono" dir="rtl">{toPersianNum(post.createdAt)}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed whitespace-pre-line text-right" dir="rtl">
                        {post.content}
                      </p>

                      {post.actionUrl && (
                        <div className="pt-2 text-left">
                          {post.actionUrl.startsWith("http") ? (
                            <a 
                              href={post.actionUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-xl shadow-xs transition-all cursor-pointer"
                            >
                              <span>{post.actionLabel || "مشاهده پیوند"}</span>
                              <ExternalLink size={12} />
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setIsChannelOpen(false);
                                const url = post.actionUrl;
                                if (url.includes("kafbazaar") || url.includes("floor")) {
                                  if (setActiveTab) setActiveTab('special-offers');
                                  if (onNavigateToBillboardSubTab) onNavigateToBillboardSubTab('floor_deals');
                                } else if (url.includes("special")) {
                                  if (setActiveTab) setActiveTab('special-offers');
                                } else if (url.includes("weekly")) {
                                  if (setActiveTab) setActiveTab('weekly-schedule');
                                } else if (url.includes("billboard")) {
                                  if (setActiveTab) setActiveTab('billboard');
                                } else if (url.includes("product") || url.includes("catalog")) {
                                  if (setActiveTab) setActiveTab('order');
                                } else {
                                  if (setActiveTab) setActiveTab('order');
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-xl shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
                            >
                              <span>{post.actionLabel || "مشاهده و ثبت سفارش"}</span>
                              <Sparkles size={12} className="text-amber-300" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-white border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold">
                <span>تضمین دست اول: خرید بدون واسطه</span>
                <span>تعداد کل پیام‌ها: {toPersianNum(channelPosts.length)}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* City & Province Selector Modal */}
      <AnimatePresence>
        {showCityModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 text-right" dir="rtl">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCityModal(false)}
              className="absolute inset-0 bg-slate-400/50 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-100"
            >
              {/* Header */}
              <div className="bg-slate-50 p-5 border-b border-slate-200/60 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-amber-800 flex items-center justify-center">
                    <MapPin size={18} className="text-emerald-600 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-black text-xs sm:text-sm text-slate-900">انتخاب شهر و استان فعالیت شما</h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">شهر خود را جهت فیلترینگ و سفارشی‌سازی خدمات پلتفرم انتخاب کنید</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCityModal(false)}
                  className="p-1.5 hover bg-slate-200/50 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body: Split Layout */}
              <div className="flex flex-1 overflow-hidden min-h-[350px]">
                {/* Right Column: Provinces List */}
                <div className="w-1/3 bg-slate-50/50 border-l border-slate-100 overflow-y-auto p-3 space-y-1">
                  <div className="text-[10px] text-slate-400 font-black px-2 pb-2 uppercase tracking-wide">استان‌ها</div>
                  {PROVINCE_CITIES_MAP.map((item, pIdx) => {
                    const isSelected = activeProvince === item.province;
                    return (
                      <button
                        key={`prov-opt-${item.province}-${pIdx}`}
                        onClick={() => setActiveProvince(item.province)}
                        className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-emerald-600 text-white font-black shadow-3xs"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <span>{item.province}</span>
                        <ChevronLeft size={12} className={isSelected ? "text-slate-950" : "text-slate-300"} />
                      </button>
                    );
                  })}
                </div>

                {/* Left Column: Cities List */}
                <div className="w-2/3 p-4 overflow-y-auto space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wide">شهرهای استان {activeProvince}</span>
                    <span className="text-[9px] text-amber-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">تعداد: {toPersianNum(PROVINCE_CITIES_MAP.find(p => p.province === activeProvince)?.cities.length || 0)} شهر</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {PROVINCE_CITIES_MAP.find(p => p.province === activeProvince)?.cities.map((city, idx) => {
                      const isSelected = selectedCity === city;
                      return (
                        <button
                          key={`nav-city-opt-${city}-${idx}`}
                          onClick={() => handleSelectCity(city, activeProvince)}
                          className={`p-3 text-right rounded-2xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-black ring-2 ring-emerald-500/10"
                              : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <span>{city}</span>
                          {isSelected && <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-50 p-4 border-t border-slate-200/60 flex items-center justify-between shrink-0">
                <div className="text-[10px] text-slate-500 font-bold">
                  موقعیت فعلی شما: <strong className="text-slate-850 font-black">{selectedCity} ({activeProvince})</strong>
                </div>
                <button
                  onClick={() => setShowCityModal(false)}
                  className="px-5 py-2 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-900/20 cursor-pointer"
                >
                  تأیید و بازگشت
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SiteFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        userPhone={user?.phone || user?.mobile}
      />
    </>
  );
}
