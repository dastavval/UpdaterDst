import { ShoppingCart, User, Search, Package, Menu, Presentation, Building2, LogOut, ShieldAlert, Sun, Moon, Globe, Award, Sparkles, X, ShoppingBag, Wand2, Compass, BookOpen, Truck, FileText, Download, Factory, ShieldCheck, MessageSquare, Home, Newspaper, GraduationCap, Headphones, Info, PhoneCall, Megaphone, TrendingDown, Lightbulb, Pin, MapPin, CheckCircle2, ChevronLeft, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
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
  user: { name: string; email: string; role: 'user' | 'admin'; company?: string; phone?: string; mobile?: string } | null;
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
  b2bConfig?: any;
  selectedCity?: string;
  onCityChange?: (city: string) => void;
  onManualSync?: () => void;
  isSyncingData?: boolean;
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
  b2bConfig,
  selectedCity: propSelectedCity,
  onCityChange,
  onManualSync,
  isSyncingData = false,
}: NavbarProps) {
  const t = translations[language] || translations.fa;
  const isRtl = language === "fa" || language === "ar";

  const [localCity, setLocalCity] = useState(() => localStorage.getItem("dastavval_user_city") || "تهران");
  const selectedCity = propSelectedCity || localCity;
  const [activeProvince, setActiveProvince] = useState(() => localStorage.getItem("dastavval_user_province") || "تهران");
  const [showCityModal, setShowCityModal] = useState(false);

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
      badgeBg: "bg-emerald-50 text-emerald-700"
    },
    teal: {
      bg: "bg-teal-600 hover",
      text: "text-teal-600",
      border: "border-teal-200",
      ring: "focus",
      badgeBg: "bg-teal-50 text-teal-700"
    },
    indigo: {
      bg: "bg-indigo-600 hover",
      text: "text-indigo-600",
      border: "border-indigo-200",
      ring: "focus",
      badgeBg: "bg-indigo-50 text-indigo-700"
    },
    amber: {
      bg: "bg-amber-600 hover",
      text: "text-amber-600",
      border: "border-amber-200",
      ring: "focus",
      badgeBg: "bg-amber-50 text-amber-700"
    },
    sky: {
      bg: "bg-sky-600 hover",
      text: "text-sky-600",
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
      case 'silver': return "bg-slate-100 text-indigo-800 border border-slate-200/40";
      case 'gold': return "bg-amber-100 text-amber-800 border border-amber-200/40";
      case 'vip': return "bg-purple-100 text-purple-800 border border-purple-200/40 animate-pulse";
      case 'admin': return "bg-rose-100 text-rose-800 border border-rose-200/40";
      default: return "";
    }
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    { id: 'admin', label: user ? t.myPanel : "ورود / عضویت", icon: <User size={18} className="text-slate-500 transition-colors" /> },
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
    if (setActiveTab) {
      setActiveTab(id as any);
    }
    setIsMobileMenuOpen(false);
  };

  const rubikaUrl = b2bConfig?.rubikaChannelUrl || "https://rubika.ir/dastavval_official";
  const telegramUrl = b2bConfig?.telegramChannelUrl || "https://t.me/dastavval_official";
  const whatsappUrl = b2bConfig?.whatsappGroupUrl || "https://chat.whatsapp.com/dastavval_official";
  const instagramUrl = b2bConfig?.instagramPageUrl || "https://instagram.com/dastavval_official";

  const showTopSocialBar = b2bConfig?.showTopSocialBar === true;

  return (
    <>
      <nav className="sticky top-0 z-50 transition-all duration-300 bg-white/80 border-b border-slate-200/50 shadow-sm text-slate-900 backdrop-blur-xl" dir={isRtl ? "rtl" : "ltr"}>
        {/* Top Social Channels Bar */}
        {showTopSocialBar && (
          <div className="bg-white text-slate-600 text-[10px] sm:text-[11px] font-bold py-1.5 px-3 sm:px-4 border-b border-slate-100 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shadow-xs">
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <span className="text-[10px] text-slate-400 font-black hidden sm:inline-block">شبکه‌های رسمی:</span>
              
              {/* Rubika Button */}
              <a
                href={rubikaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-purple-700 text-[10px] font-black transition-all flex items-center gap-1 shadow-sm shrink-0"
                title="عضویت در کانال روبیکا"
              >
                <span>روبیکا</span>
              </a>

              {/* Instagram Button */}
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-pink-700 text-[10px] font-black transition-all flex items-center gap-1 shadow-sm shrink-0"
                title="عضویت در اینستاگرام دست اول"
              >
                <span>اینستاگرام</span>
              </a>

              {/* WhatsApp Button */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-emerald-700 text-[10px] font-black transition-all flex items-center gap-1 shadow-sm shrink-0"
                title="گروه واتساپ"
              >
                <span>واتساپ</span>
              </a>

              {/* Instagram Button */}
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 hover:opacity-90 text-white text-[10px] font-black transition-all flex items-center gap-1 shadow-sm shrink-0"
                title="صفحه اینستاگرام"
              >
                <span>اینستاگرام</span>
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
              
              {supportPhone && !hideSupportPhone && (
                <a
                  href={`tel:${supportPhone}`}
                  className="text-slate-500 hover:text-emerald-600 text-[10px] font-black hidden md:flex items-center gap-1"
                >
                  <Headphones size={11} className="text-emerald-600" />
                  <span>پشتیبانی: {supportPhone}</span>
                </a>
              )}
            </div>
          </div>
        )}



        {/* Top Accent Bar */}
        <div className="h-0.5 w-full bg-gradient-to-r from-amber-400 via-emerald-500 to-amber-500 opacity-80" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16">
            
            {/* Logo and Brand Title (Ultra Compact) */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-1.5 hover text-slate-500 hover rounded-lg transition-colors cursor-pointer"
                title="مشاهده اطلاعات پلتفرم و تضمین‌ها"
              >
                <Menu size={20} />
              </button>
              <button 
                onClick={() => {
                  onModeChange('presentation');
                  setActiveTab?.('presentation');
                }}
                className="flex items-center gap-2.5 text-right group focus:outline-none cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                    <DastavvalLogo size={38} showText={false} logoUrl={logoUrl} />
                  </div>
                  <div className="flex flex-col text-right">
                    <span className={`text-sm md:text-base font-black tracking-tight leading-none text-slate-900 transition-colors`}>
                      {appName || t.appName}
                    </span>
                    {appSub && (
                      <span className={`text-[9px] font-bold ${activeColor.text} hidden md:block mt-1`}>
                        {appSub}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </div>

            {/* Desktop Center Navigation Links - Sophisticated Dock */}
            <div className="hidden lg:flex items-center justify-center gap-1.5 flex-1 max-w-2xl mx-4 bg-slate-50/50 p-1.5 rounded-[1.5rem] border border-slate-100/50">
              <button
                onClick={() => {
                  onModeChange('presentation');
                  setActiveTab?.('presentation');
                }}
                className={`px-4 py-2 rounded-2xl text-[11px] font-black transition-all duration-300 cursor-pointer flex items-center gap-2 ${
                  activeTab === 'presentation'
                    ? "bg-white text-emerald-700 shadow-material-sm border border-slate-200/50 scale-[1.02]"
                    : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
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
                className={`px-4 py-2 rounded-2xl text-[11px] font-black transition-all duration-300 cursor-pointer flex items-center gap-2 ${
                  activeTab === 'order'
                    ? "bg-white text-emerald-700 shadow-material-sm border border-slate-200/50 scale-[1.02]"
                    : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <ShoppingBag size={15} />
                <span>{t.wholesaleBuy}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab?.('billboard');
                }}
                className={`relative px-4 py-2 rounded-2xl text-[11px] font-black transition-all duration-300 cursor-pointer flex items-center gap-2 group overflow-hidden border ${
                  activeTab === 'billboard'
                    ? "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 shadow-md shadow-amber-500/30 border-amber-400 scale-[1.05] ring-2 ring-amber-400/20"
                    : "bg-amber-50/70 text-amber-950 border-amber-200/80 hover:bg-amber-100 hover:border-amber-300 shadow-2xs"
                }`}
              >
                {/* Micro pulsating light to make it look extra alive & special */}
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                </span>

                <SpecialPriceBagIcon 
                  size={18} 
                  animated={true} 
                  className="text-slate-950 drop-shadow-xs" 
                />
                <span className="relative z-10 flex items-center gap-1.5">
                  <span className="tracking-tight">کفِ بازار</span>
                  <span className="hidden xl:inline-block bg-slate-950/10 text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    حراج ویژه 🔥
                  </span>
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab?.('factories');
                }}
                className={`px-4 py-2 rounded-2xl text-[11px] font-black transition-all duration-300 cursor-pointer flex items-center gap-2 ${
                  activeTab === 'factories'
                    ? "bg-white text-emerald-700 shadow-material-sm border border-slate-200/50 scale-[1.02]"
                    : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <Building2 size={15} />
                <span>کارخانجات</span>
              </button>

              {/* Health Apple & Natural Badge Nav Button */}
              <button
                onClick={() => {
                  onModeChange('presentation');
                  setActiveTab?.('presentation');
                  setTimeout(() => {
                    const showcaseEl = document.querySelector('.health-showcase');
                    if (showcaseEl) {
                      showcaseEl.scrollIntoView({ behavior: 'smooth' });
                    }
                  }, 100);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md hover:scale-105 active:scale-95 border border-emerald-400/40"
                title="مشاهده تالار اختصاصی محصولات طبیعی، ارگانیک و دارای سیب سلامت"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                <span>🍏 سیب سلامت و طبیعی</span>
              </button>

              {user?.role === 'admin' && (
                <button
                  onClick={() => {
                    setActiveTab?.('admin');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'admin'
                      ? "bg-indigo-600 text-white shadow-md font-black ring-2 ring-indigo-400/50"
                      : "bg-amber-100 text-amber-900 hover:bg-amber-200"
                  }`}
                  title="ورود به پنل مدیریت سرور و بروزرسانی گیت‌هاب"
                >
                  <ShieldAlert size={15} className="text-amber-500" />
                  <span>پنل مدیریت و گیت‌هاب</span>
                </button>
              )}
                <button
                  onClick={() => {
                    if (user) {
                      setActiveTab?.('user');
                    } else {
                      onAuthClick();
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'user'
                      ? "bg-amber-500 text-slate-950 shadow-sm font-black"
                      : "text-slate-700 hover"
                  }`}
                >
                  <User size={15} />
                  <span>{user ? t.myPanel : "ورود / عضویت"}</span>
                </button>


              {onOpenCatalog && (
                <button
                  onClick={onOpenCatalog}
                  className="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  title="دانلود کاتالوگ جامع محصولات و قیمت خط تولید (PDF)"
                >
                  <FileText size={15} className="text-emerald-600" />
                  <span>کاتالوگ PDF</span>
                </button>
              )}

              {onOpenPwaModal && (
                <button
                  onClick={onOpenPwaModal}
                  className="px-3 py-1.5 rounded-xl text-xs font-black bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                  title="نصب وب‌اپلیکیشن PWA روی گوشی یا دسکتاپ"
                >
                  <Download size={15} className="text-indigo-600 animate-bounce" />
                  <span>نصب اپلیکیشن PWA</span>
                </button>
              )}

              {onOpenCPanelWizard && (
                <button
                  onClick={onOpenCPanelWizard}
                  className="px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-emerald-600 text-slate-950 hover:from-amber-400 hover:to-emerald-500 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm font-black border border-amber-300/60"
                  title="راه اندازی روی cPanel و phpMyAdmin (دانلود دیتابیس)"
                >
                  <Sparkles size={14} className="text-slate-950 animate-pulse" />
                  <span>راه اندازی cPanel و SQL</span>
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
                    className="p-2 text-rose-500 hover rounded-xl transition-all cursor-pointer"
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
                  ورود / عضویت
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
                <Megaphone size={16} className="text-indigo-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce">
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
                      className="w-4.5 h-4.5 bg-rose-600 text-white text-[10px] rounded-full flex items-center justify-center font-black shadow-xs"
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

      {/* Floating Bottom App Navigation Bar for Mobile Viewports (Balanced, Centered Dock) */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50 bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-[0_12px_32px_rgba(0,0,0,0.08)] rounded-2xl px-2 py-1 transition-all duration-300">
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
                  <div className={`relative z-10 flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-xl transition-all border ${
                    isActive 
                      ? "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20 scale-105 border-amber-400" 
                      : "bg-amber-50/50 text-amber-900 border-amber-100/60"
                  }`}>
                    <span className="relative flex items-center justify-center">
                      <SpecialPriceBagIcon size={20} animated={true} plain={true} className="text-slate-950" />
                      <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-600"></span>
                      </span>
                    </span>
                    <span className="text-[9px] font-black tracking-tight flex items-center gap-0.5">
                      <span>کف بازار</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping inline-block" />}
                    </span>
                  </div>
                </button>
              );
            }
            if (item.id === 'news') {
              return (
                <div key={`bottom-nav-${item.id}-${idx}`} className="relative z-20 flex flex-col items-center -mt-3">
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 text-slate-950 border-2 border-white flex items-center justify-center shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition-transform cursor-pointer font-black"
                    title={item.label}
                  >
                    <Compass size={22} className="text-slate-950 animate-spin-slow" />
                  </button>
                  <span className="text-[9px] font-black text-amber-800 mt-0.5">
                    {item.label}
                  </span>
                </div>
              );
            }
            if (item.id === 'ai') {
              return (
                <div key={`bottom-nav-${item.id}-${idx}`} className="relative z-20 flex flex-col items-center">
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 border border-amber-400 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer font-black"
                    title={item.label}
                  >
                    <Wand2 size={18} className="text-slate-950" />
                  </button>
                </div>
              );
            }
            return (
              <button
                key={`bottom-nav-${item.id}-${idx}`}
                onClick={() => handleNavClick(item.id)}
                className="flex-1 flex flex-col items-center justify-center py-1 transition-all relative cursor-pointer"
              >
                {isActive && item.id === 'billboard' && (
                  <motion.div
                    layoutId="activeMobileIndicator"
                    className="absolute inset-y-1 inset-x-2 bg-slate-100 rounded-xl z-0"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
                <div className={`relative z-10 flex flex-col items-center justify-center gap-0.5 ${isActive ? "text-slate-900 font-bold" : "text-slate-500"}`}>
                  <span className={`p-1 rounded-lg transition-all duration-300 ${isActive ? "scale-110" : ""}`}>
                    {item.icon}
                  </span>
                  <span className="text-[9px] font-black tracking-tight">
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
              className="fixed inset-0 z-[100] bg-white/50 backdrop-blur-sm"
            />

            {/* Sliding Drawer */}
            <motion.div 
              initial={{ x: isRtl ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? "100%" : "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className={`fixed top-0 bottom-0 ${isRtl ? 'right-0' : 'left-0'} w-full max-w-sm z-[101] bg-white shadow-2xl p-6 overflow-y-auto text-right flex flex-col justify-between`}
              dir={isRtl ? "rtl" : "ltr"}
            >
              <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-black text-xs">
                      د۱
                    </div>
                    <span className="text-sm font-black text-indigo-800">{appName || "پلتفرم دست اول"}</span>
                  </div>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 hover text-slate-400 hover rounded-lg cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Mobile Hamburger City Picker Widget */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50/40 p-3.5 rounded-2xl border border-amber-200/80 shadow-3xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-amber-800 font-black flex items-center gap-1">
                      <MapPin size={13} className="text-amber-600 animate-pulse" />
                      <span>شهر پیش‌فرض شما برای فیلتر:</span>
                    </span>
                    <span className="bg-amber-100 text-amber-950 font-black text-[10px] px-2 py-0.5 rounded-full border border-amber-300">
                      {selectedCity || "تهران"}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 font-bold leading-relaxed">
                    با انتخاب شهر، اولویت نمایش نمایندگان، عاملیت‌های توزیع و تخفیفات بر اساس منطقه شما تنظیم می‌گردد.
                  </p>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setShowCityModal(true);
                    }}
                    className="w-full text-center py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    تغییر شهر و استان فعالیت
                  </button>
                </div>

                {/* Instant Database & Invoice Sync Widget */}
                {onManualSync && (
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/60 shadow-3xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-800 font-black flex items-center gap-1.5">
                        <RefreshCw 
                          size={13} 
                          className={`text-emerald-600 ${isSyncingData ? "animate-spin" : ""}`} 
                        />
                        <span>همگام‌سازی لحظه‌ای سامانه:</span>
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 font-black text-[8px] px-1.5 py-0.5 rounded-full border border-emerald-200">
                        سریع و زنده ⚡
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-500 font-bold leading-relaxed">
                      بروزرسانی آنی تمامی محصولات، فاکتورها، سبد خرید و سفارشات مستقیماً از دیتابیس بدون نیاز به رفرش صفحه.
                    </p>
                    <button
                      onClick={() => {
                        onManualSync();
                      }}
                      disabled={isSyncingData}
                      className="w-full text-center py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-black rounded-xl transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <RefreshCw 
                        size={12} 
                        className={`text-emerald-600 ${isSyncingData ? "animate-spin" : ""}`} 
                      />
                      <span>{isSyncingData ? "در حال دریافت اطلاعات..." : "سینک فوری داده‌ها و فاکتورها"}</span>
                    </button>
                  </div>
                )}

                {/* Quick Menu List */}
                <div className="space-y-2">
                  <h4 className="text-[10px] text-slate-400 font-black tracking-wider uppercase">بخش‌های اصلی پلتفرم:</h4>
                  {navItems.map((item, idx) => (
                    <button
                      key={`drawer-nav-item-${item.id}-${idx}`}
                      onClick={() => handleNavClick(item.id)}
                      className="w-full text-right p-2.5 rounded-xl text-xs font-black text-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Additional Resource Links requested by user */}
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <h4 className="text-[10px] text-slate-400 font-black tracking-wider uppercase">خدمات و مجله پلتفرم:</h4>
                  <button
                    onClick={() => handleNavClick('news')}
                    className="w-full text-right p-2.5 rounded-xl text-xs font-black text-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Newspaper size={18} className="text-rose-500 shrink-0" />
                    <span>مجله علمی و آخرین اخبار</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('about')}
                    className="w-full text-right p-2.5 rounded-xl text-xs font-black text-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Info size={18} className="text-blue-500 shrink-0" />
                    <span>درباره ما و ارتباط با ما</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('learning')}
                    className="w-full text-right p-2.5 rounded-xl text-xs font-black text-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <GraduationCap size={18} className="text-amber-500 shrink-0" />
                    <span>مرکز آموزش و راهنمایی</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsFeedbackModalOpen(true);
                    }}
                    className="w-full text-right p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 text-xs font-black flex items-center gap-2.5 transition-all cursor-pointer shadow-xs mt-2"
                  >
                    <Lightbulb size={18} className="text-amber-600 shrink-0" />
                    <span>💡 گزارش ایده، پیشنهاد یا اشکال در سایت</span>
                  </button>
                </div>

                {/* Dynamic User Portal/Admin Options */}
                {user && (
                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    <h4 className="text-[10px] text-emerald-600 font-black tracking-wider uppercase">
                      {user.role === 'admin' ? "امکانات پنل مدیریت پلتفرم (ادمین):" : "امکانات پورتال تجاری شما:"}
                    </h4>
                    
                    {user.role === 'admin' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            if (setActiveTab) setActiveTab('admin');
                            window.dispatchEvent(new CustomEvent("change-admin-tab", { detail: { tab: 'system' } }));
                            setIsMobileMenuOpen(false);
                          }}
                          className="col-span-2 text-center py-2.5 bg-gradient-to-r from-slate-900 to-purple-950 text-amber-400 rounded-xl text-[10px] font-black cursor-pointer border border-purple-900/40 shadow-sm flex items-center justify-center gap-1.5"
                        >
                          🚀 بروزرسانی هوشمند سیستم (گیت‌هاب)
                        </button>
                        <button
                          onClick={() => {
                            if (setActiveTab) setActiveTab('admin');
                            window.dispatchEvent(new CustomEvent("change-admin-tab", { detail: { tab: 'orders' } }));
                            setIsMobileMenuOpen(false);
                          }}
                          className="text-right p-2 rounded-xl text-[10px] font-black text-slate-700 cursor-pointer"
                        >
                          📦 سفارشات سیستم
                        </button>
                        <button
                          onClick={() => {
                            if (setActiveTab) setActiveTab('admin');
                            window.dispatchEvent(new CustomEvent("change-admin-tab", { detail: { tab: 'products' } }));
                            setIsMobileMenuOpen(false);
                          }}
                          className="text-right p-2 rounded-xl text-[10px] font-black text-slate-700 cursor-pointer"
                        >
                          🛍️ کالاها و قیمت‌ها
                        </button>
                        <button
                          onClick={() => {
                            if (setActiveTab) setActiveTab('admin');
                            window.dispatchEvent(new CustomEvent("change-admin-tab", { detail: { tab: 'categories' } }));
                            setIsMobileMenuOpen(false);
                          }}
                          className="text-right p-2 rounded-xl text-[10px] font-black text-slate-700 cursor-pointer"
                        >
                          🏷️ دسته‌بندی‌ها
                        </button>
                        <button
                          onClick={() => {
                            if (setActiveTab) setActiveTab('admin');
                            window.dispatchEvent(new CustomEvent("change-admin-tab", { detail: { tab: 'branding' } }));
                            setIsMobileMenuOpen(false);
                          }}
                          className="text-right p-2 rounded-xl text-[10px] font-black text-slate-700 cursor-pointer"
                        >
                          🎨 برندینگ و رنگ
                        </button>
                        <button
                          onClick={() => {
                            if (setActiveTab) setActiveTab('admin');
                            window.dispatchEvent(new CustomEvent("change-admin-tab", { detail: { tab: 'factories' } }));
                            setIsMobileMenuOpen(false);
                          }}
                          className="text-right p-2 rounded-xl text-[10px] font-black text-slate-700 cursor-pointer"
                        >
                          🏢 کارخانه‌ها
                        </button>
                        <button
                          onClick={() => {
                            if (setActiveTab) setActiveTab('admin');
                            window.dispatchEvent(new CustomEvent("change-admin-tab", { detail: { tab: 'crm' } }));
                            setIsMobileMenuOpen(false);
                          }}
                          className="text-right p-2 rounded-xl text-[10px] font-black text-slate-700 cursor-pointer"
                        >
                          👥 مدیریت CRM
                        </button>
                        <button
                          onClick={() => {
                            if (setActiveTab) setActiveTab('admin');
                            window.dispatchEvent(new CustomEvent("change-admin-tab", { detail: { tab: 'profile' } }));
                            setIsMobileMenuOpen(false);
                          }}
                          className="text-right p-2 rounded-xl text-[10px] font-black text-slate-700 cursor-pointer"
                        >
                          👤 پروفایل ادمین
                        </button>
                        <button
                          onClick={() => {
                            if (setActiveTab) setActiveTab('admin');
                            window.dispatchEvent(new CustomEvent("change-admin-tab", { detail: { tab: 'reports' } }));
                            setIsMobileMenuOpen(false);
                          }}
                          className="text-right p-2 rounded-xl text-[10px] font-black text-slate-700 cursor-pointer"
                        >
                          📊 آمار و گزارشات
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            if (setActiveTab) setActiveTab('portal');
                            window.dispatchEvent(new CustomEvent("change-portal-tab", { detail: { tab: 'overview' } }));
                            setIsMobileMenuOpen(false);
                          }}
                          className="text-right p-2 rounded-xl text-[10px] font-black text-slate-700 cursor-pointer"
                        >
                          📈 خلاصه مالی عمده
                        </button>
                        <button
                          onClick={() => {
                            if (setActiveTab) setActiveTab('portal');
                            window.dispatchEvent(new CustomEvent("change-portal-tab", { detail: { tab: 'tracking' } }));
                            setIsMobileMenuOpen(false);
                          }}
                          className="text-right p-2 rounded-xl text-[10px] font-black text-slate-700 cursor-pointer"
                        >
                          🚚 رهگیری زنده بار
                        </button>
                        <button
                          onClick={() => {
                            if (setActiveTab) setActiveTab('portal');
                            window.dispatchEvent(new CustomEvent("change-portal-tab", { detail: { tab: 'roi' } }));
                            setIsMobileMenuOpen(false);
                          }}
                          className="text-right p-2 rounded-xl text-[10px] font-black text-slate-700 cursor-pointer"
                        >
                          🧮 آنالیزر سود بنکدار
                        </button>
                        <button
                          onClick={() => {
                            if (setActiveTab) setActiveTab('portal');
                            window.dispatchEvent(new CustomEvent("change-portal-tab", { detail: { tab: 'profile' } }));
                            setIsMobileMenuOpen(false);
                          }}
                          className="text-right p-2 rounded-xl text-[10px] font-black text-slate-700 cursor-pointer"
                        >
                          ⚙️ مشخصات و انبارها
                        </button>
                        <button
                          onClick={() => {
                            if (setActiveTab) setActiveTab('portal');
                            window.dispatchEvent(new CustomEvent("change-portal-tab", { detail: { tab: 'tickets' } }));
                            setIsMobileMenuOpen(false);
                          }}
                          className="text-right p-2 rounded-xl text-[10px] font-black text-slate-700 cursor-pointer"
                        >
                          💬 تیکت پشتیبانی
                        </button>
                        <button
                          onClick={() => {
                            if (setActiveTab) setActiveTab('portal');
                            window.dispatchEvent(new CustomEvent("change-portal-tab", { detail: { tab: 'notifications' } }));
                            setIsMobileMenuOpen(false);
                          }}
                          className="text-right p-2 rounded-xl text-[10px] font-black text-slate-700 cursor-pointer"
                        >
                          🔔 اعلان‌های پورتال
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        onLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-center mt-2 py-2 bg-rose-50 hover text-rose-600 rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <LogOut size={14} />
                      خروج کامل از حساب
                    </button>
                  </div>
                )}

                {/* About Us (درباره ما) */}
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <h4 className="text-[10px] text-emerald-600 font-black tracking-wider uppercase">درباره پلتفرم دست اول:</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-bold">
                    «دست اول» به عنوان جامع‌ترین بستر دیجیتال توزیع مستقیم کالاهای صنایع غذایی ایران، با حذف واسطه‌های تجاری زائد، بنکداران سراسر کشور را مستقیماً به خطوط تولید کارخانجات متصل می‌سازد. ما تجارت امن عمده را تسهیل می‌کنیم.
                  </p>
                </div>

                {/* Contact Us (تماس با ما) */}
                <div className="space-y-2 pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1.5 font-bold">
                  <h4 className="text-[10px] text-emerald-600 font-black tracking-wider uppercase">ارتباط با پشتیبانی مرکزی پلتفرم:</h4>
                  {!hideHqAddress && (
                    <div>دفتر پشتیبانی: {hqAddress || "آذربایجان شرقی، شبستر، شهرک صنعتی شندآباد"}</div>
                  )}
                  {!hideSupportPhone && (
                    <div>تلفن سراسری پشتیبانی: <span className="font-mono">{supportPhone || "۰۹۰۴۴۵۰۲۹۰۰"}</span></div>
                  )}
                  <div>ایمیل ارتباط شرکتی: <span className="font-mono text-emerald-600">info@dastavval.com</span></div>
                </div>

                {/* Practical Links Section */}
                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100">
                  {onOpenPwaModal && (
                    <button 
                      onClick={() => {
                        onOpenPwaModal();
                        setIsMobileMenuOpen(false);
                      }}
                      className="col-span-2 flex items-center justify-center gap-2 p-2.5 bg-indigo-600 text-white rounded-xl text-[11px] font-black cursor-pointer shadow-md"
                    >
                      <Download size={14} className="animate-bounce" />
                      نصب اپلیکیشن PWA (اندروید و iOS)
                    </button>
                  )}
                  {onOpenCatalog && (
                    <button 
                      onClick={() => {
                        onOpenCatalog();
                        setIsMobileMenuOpen(false);
                      }} 
                      className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl text-[10px] font-black text-slate-700 cursor-pointer"
                    >
                      <FileText size={12} className="text-emerald-600" />
                      دانلود لیست قیمت PDF
                    </button>
                  )}
                  <button 
                    onClick={() => handleNavClick('factories')}
                    className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-[10px] font-black text-slate-700 cursor-pointer transition-colors"
                  >
                    <Factory size={12} className="text-amber-500" />
                    لیست کارخانجات فعال
                  </button>
                  <button 
                    onClick={() => handleNavClick('learning')}
                    className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-[10px] font-black text-slate-700 cursor-pointer transition-colors"
                  >
                    <ShieldCheck size={12} className="text-emerald-500" />
                    شرایط ضمانت بازگشت
                  </button>
                  <button 
                    onClick={() => handleNavClick('support')}
                    className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-[10px] font-black text-slate-700 cursor-pointer transition-colors"
                  >
                    <MessageSquare size={12} className="text-purple-500" />
                    ثبت شکایات و پیشنهادات
                  </button>
                </div>

                {/* Social Media Links */}
                <div className="flex flex-col items-center gap-2 pt-4 border-t border-slate-100">
                  <span className="text-[9px] text-slate-400 font-bold">ما را در شبکه‌های اجتماعی دنبال کنید:</span>
                  <div className="flex justify-center gap-3">
                    <a 
                      href={instagramUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-rose-500 hover:scale-110 transition-transform text-white flex items-center justify-center shadow-md text-[10px] font-bold"
                      title="اینستاگرام دست اول"
                    >
                      IG
                    </a>
                    <a 
                      href={telegramUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-8 h-8 rounded-full bg-sky-500 hover:scale-110 transition-transform text-white flex items-center justify-center shadow-md text-[10px] font-bold"
                      title="تلگرام دست اول"
                    >
                      TG
                    </a>
                    <a 
                      href={whatsappUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-8 h-8 rounded-full bg-emerald-600 hover:scale-110 transition-transform text-white flex items-center justify-center shadow-md text-[10px] font-bold"
                      title="واتساپ دست اول"
                    >
                      WA
                    </a>
                    {rubikaUrl && (
                      <a 
                        href={rubikaUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-8 h-8 rounded-full bg-purple-700 hover:scale-110 transition-transform text-white flex items-center justify-center shadow-md text-[10px] font-bold"
                        title="روبیکا دست اول"
                      >
                        روبیکا
                      </a>
                    )}
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
                    <Megaphone size={20} className="text-indigo-600" />
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
                          ? "border-amber-400 bg-amber-50/10 ring-2 ring-amber-400/20 rounded-3xl"
                          : idx === 0
                            ? "border-indigo-500 ring-2 ring-indigo-500/10 rounded-3xl"
                            : "border-slate-150 rounded-2xl"
                      }`}
                    >
                      {post.pinned ? (
                        <span className="absolute top-0 left-0 bg-amber-500 text-slate-900 text-[8px] font-black px-2.5 py-1 rounded-br-2xl flex items-center gap-1">
                          <Pin size={8} className="fill-slate-900" />
                          مهم / سنجاق شده
                        </span>
                      ) : idx === 0 ? (
                        <span className="absolute top-0 left-0 bg-indigo-600 text-white text-[8px] font-black px-2.5 py-1 rounded-br-2xl">
                          جدیدترین اطلاعیه
                        </span>
                      ) : null}

                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            post.category === 'urgent' ? 'bg-red-100 text-red-700 border border-red-200/50' :
                            post.category === 'festival' ? 'bg-amber-100 text-amber-800 border border-amber-200/50' :
                            post.category === 'system' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200/50' :
                            'bg-slate-100 text-slate-750'
                          }`}>
                            {post.category === 'urgent' ? '🔴 فوری' :
                             post.category === 'festival' ? '🎉 جشنواره' :
                             post.category === 'system' ? '⚙️ سیستمی' :
                             '📣 عمومی'}
                          </span>
                          <h4 className="font-black text-xs text-slate-900 leading-tight flex items-center gap-1.5">
                            {post.pinned && <Pin size={11} className="text-amber-500 fill-amber-500" />}
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
                          <a 
                            href={post.actionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-xl shadow-xs transition-all cursor-pointer"
                          >
                            <span>{post.actionLabel || "مشاهده پیوند / ثبت سفارش"}</span>
                          </a>
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
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-800 flex items-center justify-center">
                    <MapPin size={18} className="text-amber-600 animate-pulse" />
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
                            ? "bg-amber-500 text-slate-950 font-black shadow-3xs"
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
                    <span className="text-[9px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-bold">تعداد: {toPersianNum(PROVINCE_CITIES_MAP.find(p => p.province === activeProvince)?.cities.length || 0)} شهر</span>
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
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
