import { ShoppingCart, User, Search, Package, Menu, Presentation, Building2, LogOut, ShieldAlert, Sun, Moon, Globe, Award, Sparkles, X, ShoppingBag, Wand2, Compass, BookOpen, Truck, FileText, Download, Factory, ShieldCheck, MessageSquare, Home, Newspaper, GraduationCap, Headphones, Info, PhoneCall } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { translations, Language } from "../lib/translations";
import DastavvalLogo from "./DastavvalLogo";

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  appMode: 'presentation' | 'portal';
  onModeChange: (mode: 'presentation' | 'portal') => void;
  user: { name: string; email: string; role: 'user' | 'admin'; company?: string } | null;
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
}

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
  topAnnouncement = "🚀 تخفیف ویژه جشنواره تابستانه کارخانجات - ارسال مستقیم و هماهنگ‌شده بر اساس ضوابط کارخانه",
  showTopAnnouncement = true,
  onOpenAnnouncementModal,
  hqAddress,
  supportPhone,
  hideHqAddress = false,
  hideSupportPhone = false,
  onOpenCatalog,
  onOpenPwaModal,
  onOpenCPanelWizard,
  b2bConfig,
}: NavbarProps) {
  const t = translations[language] || translations.fa;
  const isRtl = language === "fa" || language === "ar";

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
      bg: "bg-emerald-700 hover",
      text: "text-emerald-700",
      border: "border-emerald-600/30",
      ring: "focus",
      badgeBg: "bg-emerald-100 text-emerald-800"
    },
    teal: {
      bg: "bg-teal-700 hover",
      text: "text-teal-700",
      border: "border-teal-600/30",
      ring: "focus",
      badgeBg: "bg-teal-100 text-teal-800"
    },
    indigo: {
      bg: "bg-indigo-700 hover",
      text: "text-indigo-700",
      border: "border-indigo-600/30",
      ring: "focus",
      badgeBg: "bg-indigo-100 text-indigo-800"
    },
    amber: {
      bg: "bg-amber-700 hover",
      text: "text-amber-700",
      border: "border-amber-600/30",
      ring: "focus",
      badgeBg: "bg-amber-100 text-amber-800"
    },
    sky: {
      bg: "bg-sky-700 hover",
      text: "text-sky-700",
      border: "border-sky-600/30",
      ring: "focus",
      badgeBg: "bg-sky-100 text-sky-800"
    },
    violet: {
      bg: "bg-violet-700 hover",
      text: "text-violet-700",
      border: "border-violet-600/30",
      ring: "focus",
      badgeBg: "bg-violet-100 text-violet-800"
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
  const [logoFailed, setLogoFailed] = useState(false);
  const [mascotFailed, setMascotFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  const navItems = [
    { id: 'presentation', label: t.home, icon: <Home size={18} /> },
    { id: 'order', label: t.wholesaleBuy, icon: <ShoppingBag size={18} /> },
    { id: 'factories', label: "کارخانجات", icon: <Building2 size={18} /> },
    { id: 'admin', label: user ? t.myPanel : "ورود / عضویت", icon: <User size={18} /> },
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
      <nav className="sticky top-0 z-50 transition-all duration-300 bg-white/95 border-b border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.04)] text-slate-900 backdrop-blur-md" dir={isRtl ? "rtl" : "ltr"}>
        {/* Top Social Channels Bar (Disabled by default, toggleable in admin) */}
        {showTopSocialBar && (
          <div className="bg-slate-900 text-white text-[10px] sm:text-[11px] font-bold py-1 px-3 sm:px-4 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <span className="text-[10px] text-amber-400 font-black hidden sm:inline-block">شبکه‌های اجتماعی رسمی:</span>
              
              {/* Rubika Button */}
              <a
                href={rubikaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-0.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black transition-all flex items-center gap-1 shadow-sm shrink-0"
                title="عضویت در کانال روبیکا"
              >
                <span>روبیکا</span>
              </a>

              {/* Telegram Button */}
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-0.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-[10px] font-black transition-all flex items-center gap-1 shadow-sm shrink-0"
                title="عضویت در کانال تلگرام"
              >
                <span>تلگرام</span>
              </a>

              {/* WhatsApp Button */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-0.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black transition-all flex items-center gap-1 shadow-sm shrink-0"
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
                className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-slate-950 text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer"
              >
                <Download size={10} />
                <span>نصب اپلیکیشن</span>
              </button>
              
              {supportPhone && !hideSupportPhone && (
                <a
                  href={`tel:${supportPhone}`}
                  className="text-slate-300 hover:text-amber-400 text-[10px] font-black hidden md:flex items-center gap-1"
                >
                  <Headphones size={11} className="text-amber-400" />
                  <span>پشتیبانی: {supportPhone}</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Top Announcement Bar */}
        {showTopAnnouncement && topAnnouncement && !isAnnouncementDismissed && (
          <div 
            className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-slate-950 text-[11px] font-black py-1.5 px-4 border-b border-amber-400 flex items-center justify-between gap-2 overflow-hidden shadow-inner transition-all group"
          >
            <div 
              onClick={() => onOpenAnnouncementModal?.()}
              className="flex-1 flex items-center justify-center gap-2 cursor-pointer truncate"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-800 animate-ping shrink-0" />
              <span className="truncate group-hover:underline">{topAnnouncement}</span>
              <span className="text-[9px] bg-white text-amber-900 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 font-black">
                <span>جزئیات</span>
                <span>←</span>
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsAnnouncementDismissed(true);
              }}
              className="p-1 text-slate-950 hover:bg-black/10 rounded-full transition-colors cursor-pointer shrink-0"
              title="بستن اعلان"
            >
              <X size={14} />
            </button>
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

            {/* Desktop Center Navigation Links with CIRCULAR SPECIAL AI BUTTON */}
            <div className="hidden lg:flex items-center justify-center gap-2 flex-1 max-w-2xl mx-4">
              <button
                onClick={() => {
                  onModeChange('presentation');
                  setActiveTab?.('presentation');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'presentation'
                    ? "bg-amber-500 text-slate-950 shadow-sm font-black"
                    : "text-slate-700 hover"
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'order'
                    ? "bg-amber-500 text-slate-950 shadow-sm font-black"
                    : "text-slate-700 hover"
                }`}
              >
                <ShoppingBag size={15} />
                <span>{t.wholesaleBuy}</span>
              </button>





              <button
                onClick={() => {
                  setActiveTab?.('factories');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'factories'
                    ? "bg-amber-500 text-slate-950 shadow-sm font-black"
                    : "text-slate-700 hover:text-emerald-600"
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

              <button
                onClick={() => {
                  setActiveTab?.('admin');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'admin'
                    ? "bg-slate-900 text-amber-400 shadow-md font-black ring-2 ring-amber-400/50"
                    : "bg-amber-100 text-amber-900 hover:bg-amber-200"
                }`}
                title="ورود به پنل مدیریت سرور و بروزرسانی گیت‌هاب"
              >
                <ShieldAlert size={15} className="text-amber-500" />
                <span>پنل مدیریت و گیت‌هاب</span>
              </button>
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

              {/* Support Call Button Next to Cart */}
              <a
                href="tel:09999123001"
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-full text-xs font-black transition-all cursor-pointer shadow-xs shrink-0 group"
                title="تماس تلفنی با پشتیبانی مشتریان"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                  <PhoneCall size={13} className="animate-pulse" />
                </div>
                <span className="font-black text-emerald-950">پشتیبانی مشتریان</span>
              </a>

              {/* Cart Button */}
              <button 
                onClick={onCartClick} 
                className="p-2 sm:px-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl relative hover:scale-105 transition-transform cursor-pointer flex items-center gap-1.5"
                aria-label="View Cart"
                title="مشاهده سبد خرید"
              >
                <ShoppingCart size={18} />
                <span className="text-xs font-black hidden xs:inline">سبد خرید</span>
                {cartCount > 0 && (
                  <span className="w-4.5 h-4.5 bg-rose-600 text-white text-[10px] rounded-full flex items-center justify-center font-black shadow-xs">
                    {cartCount}
                  </span>
                )}
              </button>


            </div>
          </div>
        </div>
      </nav>

      {/* Floating Bottom App Navigation Bar for Mobile Viewports (Balanced, Centered Dock) */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50 bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-[0_12px_32px_rgba(0,0,0,0.08)] rounded-2xl px-2 py-1 transition-all duration-300">
        <div className="flex justify-around items-center h-14 relative">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            if (item.id === 'news') {
              return (
                <div key={item.id} className="relative z-20 flex flex-col items-center -mt-3">
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
                <div key={item.id} className="relative z-20 flex flex-col items-center">
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
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="flex-1 flex flex-col items-center justify-center py-1 transition-all relative cursor-pointer"
              >
                {isActive && (
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

                {/* Quick Menu List */}
                <div className="space-y-2">
                  <h4 className="text-[10px] text-slate-400 font-black tracking-wider uppercase">بخش‌های اصلی پلتفرم:</h4>
                  {navItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className="w-full text-right p-2.5 rounded-xl text-xs font-black text-slate-700 hover flex items-center gap-2 transition-colors cursor-pointer"
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
                    className="w-full text-right p-2.5 rounded-xl text-xs font-black text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Newspaper size={18} className="text-rose-500 shrink-0" />
                    <span>مجله علمی و آخرین اخبار</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('about')}
                    className="w-full text-right p-2.5 rounded-xl text-xs font-black text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Info size={18} className="text-blue-500 shrink-0" />
                    <span>درباره ما و ارتباط با ما</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('learning')}
                    className="w-full text-right p-2.5 rounded-xl text-xs font-black text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <GraduationCap size={18} className="text-amber-500 shrink-0" />
                    <span>مرکز آموزش و راهنمایی</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('support')}
                    className="w-full text-right p-2.5 rounded-xl text-xs font-black text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Headphones size={18} className="text-purple-500 shrink-0" />
                    <span>پشتیبانی و امور مشترکان، سوالات متداول</span>
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
                          className="text-right p-2 bg-slate-50 hover rounded-xl text-[10px] font-black text-slate-700 cursor-pointer"
                        >
                          📦 سفارشات سیستم
                        </button>
                        <button
                          onClick={() => {
                            if (setActiveTab) setActiveTab('admin');
                            window.dispatchEvent(new CustomEvent("change-admin-tab", { detail: { tab: 'products' } }));
                            setIsMobileMenuOpen(false);
                          }}
                          className="text-right p-2 bg-slate-50 hover rounded-xl text-[10px] font-black text-slate-700 cursor-pointer"
                        >
                          🛍️ کالاها و قیمت‌ها
                        </button>
                        <button
                          onClick={() => {
                            if (setActiveTab) setActiveTab('admin');
                            window.dispatchEvent(new CustomEvent("change-admin-tab", { detail: { tab: 'categories' } }));
                            setIsMobileMenuOpen(false);
                          }}
                          className="text-right p-2 bg-slate-50 hover rounded-xl text-[10px] font-black text-slate-700 cursor-pointer"
                        >
                          🏷️ دسته‌بندی‌ها
                        </button>
                        <button
                          onClick={() => {
                            if (setActiveTab) setActiveTab('admin');
                            window.dispatchEvent(new CustomEvent("change-admin-tab", { detail: { tab: 'branding' } }));
                            setIsMobileMenuOpen(false);
                          }}
                          className="text-right p-2 bg-slate-50 hover rounded-xl text-[10px] font-black text-slate-700 cursor-pointer"
                        >
                          🎨 برندینگ و رنگ
                        </button>
                        <button
                          onClick={() => {
                            if (setActiveTab) setActiveTab('admin');
                            window.dispatchEvent(new CustomEvent("change-admin-tab", { detail: { tab: 'factories' } }));
                            setIsMobileMenuOpen(false);
                          }}
                          className="text-right p-2 bg-slate-50 hover rounded-xl text-[10px] font-black text-slate-700 cursor-pointer"
                        >
                          🏢 کارخانه‌ها
                        </button>
                        <button
                          onClick={() => {
                            if (setActiveTab) setActiveTab('admin');
                            window.dispatchEvent(new CustomEvent("change-admin-tab", { detail: { tab: 'crm' } }));
                            setIsMobileMenuOpen(false);
                          }}
                          className="text-right p-2 bg-slate-50 hover rounded-xl text-[10px] font-black text-slate-700 cursor-pointer"
                        >
                          👥 مدیریت CRM
                        </button>
                        <button
                          onClick={() => {
                            if (setActiveTab) setActiveTab('admin');
                            window.dispatchEvent(new CustomEvent("change-admin-tab", { detail: { tab: 'profile' } }));
                            setIsMobileMenuOpen(false);
                          }}
                          className="text-right p-2 bg-slate-50 hover rounded-xl text-[10px] font-black text-slate-700 cursor-pointer"
                        >
                          👤 پروفایل ادمین
                        </button>
                        <button
                          onClick={() => {
                            if (setActiveTab) setActiveTab('admin');
                            window.dispatchEvent(new CustomEvent("change-admin-tab", { detail: { tab: 'reports' } }));
                            setIsMobileMenuOpen(false);
                          }}
                          className="text-right p-2 bg-slate-50 hover rounded-xl text-[10px] font-black text-slate-700 cursor-pointer"
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
                          className="text-right p-2 bg-slate-50 hover rounded-xl text-[10px] font-black text-slate-700 cursor-pointer"
                        >
                          📈 خلاصه مالی عمده
                        </button>
                        <button
                          onClick={() => {
                            if (setActiveTab) setActiveTab('portal');
                            window.dispatchEvent(new CustomEvent("change-portal-tab", { detail: { tab: 'tracking' } }));
                            setIsMobileMenuOpen(false);
                          }}
                          className="text-right p-2 bg-slate-50 hover rounded-xl text-[10px] font-black text-slate-700 cursor-pointer"
                        >
                          🚚 رهگیری زنده بار
                        </button>
                        <button
                          onClick={() => {
                            if (setActiveTab) setActiveTab('portal');
                            window.dispatchEvent(new CustomEvent("change-portal-tab", { detail: { tab: 'roi' } }));
                            setIsMobileMenuOpen(false);
                          }}
                          className="text-right p-2 bg-slate-50 hover rounded-xl text-[10px] font-black text-slate-700 cursor-pointer"
                        >
                          🧮 آنالیزر سود بنکدار
                        </button>
                        <button
                          onClick={() => {
                            if (setActiveTab) setActiveTab('portal');
                            window.dispatchEvent(new CustomEvent("change-portal-tab", { detail: { tab: 'profile' } }));
                            setIsMobileMenuOpen(false);
                          }}
                          className="text-right p-2 bg-slate-50 hover rounded-xl text-[10px] font-black text-slate-700 cursor-pointer"
                        >
                          ⚙️ مشخصات و انبارها
                        </button>
                        <button
                          onClick={() => {
                            if (setActiveTab) setActiveTab('portal');
                            window.dispatchEvent(new CustomEvent("change-portal-tab", { detail: { tab: 'tickets' } }));
                            setIsMobileMenuOpen(false);
                          }}
                          className="text-right p-2 bg-slate-50 hover rounded-xl text-[10px] font-black text-slate-700 cursor-pointer"
                        >
                          💬 تیکت پشتیبانی
                        </button>
                        <button
                          onClick={() => {
                            if (setActiveTab) setActiveTab('portal');
                            window.dispatchEvent(new CustomEvent("change-portal-tab", { detail: { tab: 'notifications' } }));
                            setIsMobileMenuOpen(false);
                          }}
                          className="text-right p-2 bg-slate-50 hover rounded-xl text-[10px] font-black text-slate-700 cursor-pointer"
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
                  <h4 className="text-[10px] text-emerald-600 font-black tracking-wider uppercase">درباره پلتفرم ملی دست اول:</h4>
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
    </>
  );
}
