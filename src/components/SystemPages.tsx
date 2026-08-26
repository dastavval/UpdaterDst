import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  ServerCrash,
  WifiOff,
  Clock,
  Search,
  Home,
  ArrowRight,
  ArrowLeft,
  RotateCw,
  PhoneCall,
  MessageSquare,
  Copy,
  Check,
  FileQuestion,
  Lock,
  Compass,
  Layers,
  ChevronDown,
  ChevronUp,
  LifeBuoy,
  RefreshCcw,
  Sparkles,
  ShoppingBag,
  Building2,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export type ErrorType = 
  | '404' 
  | '403' 
  | '500' 
  | '503' 
  | 'offline' 
  | '429' 
  | 'pending_approval';

export interface ErrorPageProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  errorCode?: string;
  details?: string;
  onNavigateHome?: () => void;
  onNavigateTab?: (tabName: string) => void;
  onRetry?: () => void;
  onOpenAuthModal?: () => void;
  onSearch?: (query: string) => void;
  supportPhone?: string;
}

export default function SystemPages({
  type = '404',
  title,
  message,
  errorCode,
  details,
  onNavigateHome,
  onNavigateTab,
  onRetry,
  onOpenAuthModal,
  onSearch,
  supportPhone = "09999123001"
}: ErrorPageProps) {
  const [activeError, setActiveError] = useState<ErrorType>(type);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retrySuccess, setRetrySuccess] = useState<boolean | null>(null);
  const [diagnosticTime, setDiagnosticTime] = useState<string>("");

  useEffect(() => {
    setActiveError(type);
  }, [type]);

  useEffect(() => {
    setDiagnosticTime(new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, [activeError]);

  const handleCopyDiagnostics = () => {
    const diagReport = `
گزارش عیب‌یابی سامانه دست اول
کد خطا: ${activeError.toUpperCase()}
زمان بروز: ${new Date().toISOString()}
آدرس صفحه: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}
شناسه رهگیری: ERR-${Math.floor(100000 + Math.random() * 900000)}
توضیحات: ${details || 'خطای کاربری یا سرور رخ داده است'}
    `.trim();

    navigator.clipboard.writeText(diagReport);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleSimulateRetry = () => {
    setIsRetrying(true);
    setRetrySuccess(null);
    setTimeout(() => {
      setIsRetrying(false);
      if (onRetry) {
        onRetry();
      } else {
        setRetrySuccess(true);
        setTimeout(() => {
          if (onNavigateHome) onNavigateHome();
        }, 800);
      }
    }, 1200);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (onSearch) {
      onSearch(searchQuery);
    } else if (onNavigateTab) {
      onNavigateTab('order');
    } else if (onNavigateHome) {
      onNavigateHome();
    }
  };

  // Error Definitions Configuration
  const ERROR_CONFIGS: Record<ErrorType, {
    badge: string;
    badgeColor: string;
    numberBadge: string;
    title: string;
    subtitle: string;
    desc: string;
    icon: React.ReactNode;
    bgGlow: string;
    borderHighlight: string;
    quickActions: { label: string; tab?: string; icon: any; primary?: boolean; action?: () => void }[];
  }> = {
    '404': {
      badge: "صفحه پیدا نشد",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
      numberBadge: "404",
      title: title || "صفحه یا محصول مورد نظر در دسترس نیست",
      subtitle: "شاید آدرس اشتباه وارد شده یا کالا موقتاً ناموجود یا منتقل شده است",
      desc: message || "مسیری که به دنبال آن بودید در ساختار فعلی سامانه دست اول وجود ندارد. می‌توانید از طریق جستجوی سریع زیر، کالاها یا کارخانجات مدنظر خود را پیدا کنید.",
      icon: <FileQuestion className="w-12 h-12 text-amber-600" />,
      bgGlow: "from-amber-500/10 via-amber-500/5 to-transparent",
      borderHighlight: "border-amber-200",
      quickActions: [
        { label: "پیشخوان اصلی", icon: Home, primary: true, action: onNavigateHome },
        { label: "فهرست سفارش عمده", tab: "order", icon: ShoppingBag, action: () => onNavigateTab && onNavigateTab('order') },
        { label: "مشاهده کارخانجات", tab: "factories", icon: Building2, action: () => onNavigateTab && onNavigateTab('factories') }
      ]
    },
    '403': {
      badge: "عدم دسترسی مجاز",
      badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
      numberBadge: "403",
      title: title || "دسترسی به این بخش نیازمند مجوز سازمانی است",
      subtitle: "حساب کاربری فعلی شما اجازه مشاهده یا ویرایش این منبع را ندارد",
      desc: message || "این بخش اختصاصی برای مدیران کل، مدیران کارخانه یا نمایندگان استانی تنظیم شده است. در صورتی که دارای حساب مربوطه هستید، لطفاً وارد شوید.",
      icon: <Lock className="w-12 h-12 text-rose-600" />,
      bgGlow: "from-rose-500/10 via-rose-500/5 to-transparent",
      borderHighlight: "border-rose-200",
      quickActions: [
        { label: "ورود با نقش مجاز", icon: Lock, primary: true, action: onOpenAuthModal },
        { label: "پیشخوان اصلی", icon: Home, action: onNavigateHome },
        { label: "تماس با پشتیبانی ارشد", icon: PhoneCall, action: () => window.open(`tel:${supportPhone}`) }
      ]
    },
    '500': {
      badge: "خطای پردازش سرور",
      badgeColor: "bg-red-50 text-red-800 border-red-200",
      numberBadge: "500",
      title: title || "مشکلی در پردازش اطلاعات رخ داده است",
      subtitle: "سرویس مرکزی با یک خطای غیرمنتظره روبه‌رو شده است",
      desc: message || "تیم فنی سامانه بلافاصله از این رویداد مطلع شده و در حال بررسی لاگ خطاها هستند. معمولاً با یک بار تلاش مجدد، مشکل برطرف می‌گردد.",
      icon: <ServerCrash className="w-12 h-12 text-red-600" />,
      bgGlow: "from-red-500/10 via-red-500/5 to-transparent",
      borderHighlight: "border-red-200",
      quickActions: [
        { label: "تلاش مجدد و بارگذاری", icon: RefreshCcw, primary: true, action: handleSimulateRetry },
        { label: "بازگشت به پیشخوان", icon: Home, action: onNavigateHome },
        { label: "ارسال گزارش خطا به پشتیبانی", icon: MessageSquare, action: handleCopyDiagnostics }
      ]
    },
    '503': {
      badge: "بهینه‌سازی و به‌روزرسانی",
      badgeColor: "bg-indigo-50 text-indigo-800 border-indigo-200",
      numberBadge: "503",
      title: title || "سامانه در حال ارتقا و بهینه‌سازی است",
      subtitle: "عملیات دوره‌ای بهبود کارایی و پایگاه داده در جریان است",
      desc: message || "به منظور افزایش سرعت پردازش فاکتورهای عمده و هماهنگی با سامانه ترابری، سرویس‌دهی موقتاً با اعمال آخرین پچ‌های امنیتی ادامه خواهد یافت.",
      icon: <Clock className="w-12 h-12 text-indigo-600" />,
      bgGlow: "from-indigo-500/10 via-indigo-500/5 to-transparent",
      borderHighlight: "border-indigo-200",
      quickActions: [
        { label: "بررسی وضعیت اتصال", icon: RotateCw, primary: true, action: handleSimulateRetry },
        { label: "صفحه اصلی", icon: Home, action: onNavigateHome }
      ]
    },
    'offline': {
      badge: "عدم اتصال به اینترنت",
      badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
      numberBadge: "قطع ارتباط",
      title: title || "ارتباط با شبکه یا اینترنت برقرار نیست",
      subtitle: "دستگاه شما آفلاین شده است و امکان تبادل داده با سرور وجود ندارد",
      desc: message || "لطفاً اتصال Wi-Fi یا دیتای سیم‌کارت خود را بررسی نمایید. اطلاعات کش شده و کاتالوگ‌های آفلاین در دسترس شما باقی می‌مانند.",
      icon: <WifiOff className="w-12 h-12 text-slate-600" />,
      bgGlow: "from-slate-500/10 via-slate-500/5 to-transparent",
      borderHighlight: "border-slate-300",
      quickActions: [
        { label: "تلاش برای اتصال مجدد", icon: RotateCw, primary: true, action: handleSimulateRetry },
        { label: "مشاهده کاتالوگ آفلاین", icon: Layers, action: () => onNavigateTab && onNavigateTab('catalog') }
      ]
    },
    '429': {
      badge: "محدودیت نرخ درخواست",
      badgeColor: "bg-orange-50 text-orange-800 border-orange-200",
      numberBadge: "429",
      title: title || "تعداد درخواست‌ها بیش از حد مجاز است",
      subtitle: "سامانه ضد حملات Brute-Force موقتاً دسترسی را محدود کرده است",
      desc: message || "جهت حفاظت از امنیت سفارش‌ها و حساب‌ها، ارسال درخواست مکرر در بازه کوتاه محدود شده است. لطفاً چند لحظه صبر کنید.",
      icon: <ShieldAlert className="w-12 h-12 text-orange-600" />,
      bgGlow: "from-orange-500/10 via-orange-500/5 to-transparent",
      borderHighlight: "border-orange-200",
      quickActions: [
        { label: "تلاش پس از چند دقیقه", icon: Clock, primary: true, action: handleSimulateRetry },
        { label: "صفحه اصلی", icon: Home, action: onNavigateHome }
      ]
    },
    'pending_approval': {
      badge: "احراز هویت در حال بررسی",
      badgeColor: "bg-cyan-50 text-cyan-800 border-cyan-200",
      numberBadge: "بررسی",
      title: title || "مدارک و حساب شما در صف تأیید کارشناسی است",
      subtitle: "واحد پذیرش کارخانجات و نمایندگی‌ها در حال بررسی مدارک هستند",
      desc: message || "پس از بررسی پروانه کسب، مدارک هویتی یا صلاحیت عاملیت استانی، پیامک فعال‌سازی حساب از طریق وب‌سرویس ملی‌پیامک برای شما ارسال خواهد شد.",
      icon: <LifeBuoy className="w-12 h-12 text-cyan-600" />,
      bgGlow: "from-cyan-500/10 via-cyan-500/5 to-transparent",
      borderHighlight: "border-cyan-200",
      quickActions: [
        { label: "تماس با واحد پذیرش", icon: PhoneCall, primary: true, action: () => window.open(`tel:${supportPhone}`) },
        { label: "پیشخوان اصلی", icon: Home, action: onNavigateHome }
      ]
    }
  };

  const currentConfig = ERROR_CONFIGS[activeError] || ERROR_CONFIGS['404'];

  return (
    <div className="w-full max-w-4xl mx-auto my-6 px-4" dir="rtl">
      
      {/* Interactive Switcher for Development & Testing */}
      <div className="mb-4 p-2 bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-bold text-slate-600 overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0 px-2">
          <Sparkles size={14} className="text-indigo-600" />
          <span>تست زنده‌ی انواع خطاها:</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {(['404', '403', '500', '503', 'offline', '429', 'pending_approval'] as ErrorType[]).map((errKey, errIdx) => (
            <button
              key={`err-btn-${errKey}-${errIdx}`}
              type="button"
              onClick={() => setActiveError(errKey)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                activeError === errKey
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200/60"
              }`}
            >
              {errKey.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Creative Error Container */}
      <motion.div
        key={`error-page-card-${activeError}`}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.25 }}
        className={`relative bg-white rounded-2xl border ${currentConfig.borderHighlight} shadow-sm overflow-hidden p-6 sm:p-10`}
      >
        {/* Subtle Ambient Background Gradient */}
        <div className={`absolute top-0 right-0 left-0 h-48 bg-gradient-to-b ${currentConfig.bgGlow} pointer-events-none`} />

        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          
          {/* Top Badges & Numeric Code */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black border ${currentConfig.badgeColor}`}>
                {currentConfig.badge}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-mono font-bold">
                شناسه: {errorCode || `ERR-${activeError.toUpperCase()}`}
              </span>
            </div>

            {/* Creative Icon Circle with Crisp Shadow */}
            <div className="relative mt-2">
              <div className="w-24 h-24 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-center">
                {currentConfig.icon}
              </div>
              <div className="absolute -bottom-2 -left-2 bg-slate-900 text-white text-[10px] font-mono font-black px-2 py-0.5 rounded-md border border-slate-700 shadow-xs">
                {currentConfig.numberBadge}
              </div>
            </div>
          </div>

          {/* Titles & Headings */}
          <div className="space-y-2 max-w-xl">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {currentConfig.title}
            </h2>
            <p className="text-sm font-bold text-slate-600">
              {currentConfig.subtitle}
            </p>
            <p className="text-xs text-slate-500 font-medium leading-relaxed pt-1">
              {currentConfig.desc}
            </p>
          </div>

          {/* Integrated Search Box for 404 Pages */}
          {activeError === '404' && (
            <form onSubmit={handleSearchSubmit} className="w-full max-w-md">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجوی نام کالا، برند یا کارخانه مورد نظر..."
                  className="w-full pl-24 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                />
                <Search size={16} className="absolute right-3.5 text-slate-400" />
                <button
                  type="submit"
                  className="absolute left-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-lg transition-all cursor-pointer shadow-xs"
                >
                  جستجو
                </button>
              </div>
            </form>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 w-full max-w-lg">
            {currentConfig.quickActions.map((action, idx) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={action.action}
                  disabled={isRetrying}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                    action.primary
                      ? "bg-slate-900 hover:bg-slate-800 text-white hover:scale-[1.02] active:scale-[0.98]"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80"
                  }`}
                >
                  {isRetrying && action.primary ? (
                    <RotateCw size={14} className="animate-spin text-white" />
                  ) : (
                    <ActionIcon size={15} />
                  )}
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>

          {/* Direct Support Phone Box */}
          <div className="pt-4 border-t border-slate-100 w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <PhoneCall size={14} className="text-emerald-600" />
              <span>پشتیبانی سریع سفارشات و امور فنی:</span>
              <a 
                href={`tel:${supportPhone}`} 
                className="font-mono font-black text-slate-900 hover:text-indigo-600 transition-colors"
                dir="ltr"
              >
                {supportPhone}
              </a>
            </div>

            <button
              type="button"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>اطلاعات عیب‌یابی سرور</span>
              {showTechnicalDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>

          {/* Technical Diagnostics Accordion */}
          <AnimatePresence>
            {showTechnicalDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full text-right bg-slate-950 text-slate-300 p-4 rounded-xl text-[11px] font-mono space-y-2 border border-slate-800 shadow-inner overflow-hidden"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-amber-400 font-bold">Trace & Diagnostic Log:</span>
                  <button
                    type="button"
                    onClick={handleCopyDiagnostics}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer transition-all"
                  >
                    {copiedCode ? (
                      <>
                        <Check size={11} className="text-emerald-400" />
                        <span className="text-emerald-400">کپی شد</span>
                      </>
                    ) : (
                      <>
                        <Copy size={11} />
                        <span>کپی لاگ خطا</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="space-y-1 text-slate-400 leading-relaxed select-all">
                  <div>Status: <span className="text-rose-400">{activeError.toUpperCase()}</span></div>
                  <div>Timestamp: <span>{diagnosticTime}</span></div>
                  <div>Client: <span>{typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'Unknown'}</span></div>
                  <div>Details: <span className="text-slate-300">{details || 'No fatal unhandled exceptions logged. Safe fallback active.'}</span></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </div>
  );
}
