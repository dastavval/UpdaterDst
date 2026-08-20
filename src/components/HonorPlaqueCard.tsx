import React, { useState, useRef } from "react";
import { 
  Download, 
  Award, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Share2, 
  Printer, 
  Star, 
  QrCode, 
  Check, 
  FileText, 
  ExternalLink,
  Copy,
  Eye,
  Layers,
  ChevronRight,
  Maximize2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toPng, toJpeg } from "html-to-image";
import jsPDF from "jspdf";

interface HonorPlaqueCardProps {
  repName: string;
  companyName: string;
  tierLevel: number;
  tierTitle: string;
  badgeLabel: string;
  monthlySales: number;
  promotionDate?: string;
  agencyCode: string;
  province?: string;
  city?: string;
  showDownloadButton?: boolean;
  onOpenPdfModal?: () => void;
}

const toPersianNum = (num: number | string | undefined | null) => {
  if (num === undefined || num === null || num === "") return "۰";
  const s = String(num);
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return s.replace(/\d/g, (d) => persianDigits[parseInt(d, 10)]);
};

export default function HonorPlaqueCard({
  repName,
  companyName,
  tierLevel,
  tierTitle,
  badgeLabel,
  monthlySales,
  promotionDate = "۱۴۰۵/۰۵/۲۲",
  agencyCode,
  province = "خراسان رضوی",
  city = "مشهد",
  showDownloadButton = true,
  onOpenPdfModal
}: HonorPlaqueCardProps) {
  const [activeDocTab, setActiveDocTab] = useState<'plaque' | 'contract' | 'license'>('plaque');
  const [isDownloadingPng, setIsDownloadingPng] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [plaqueTheme, setPlaqueTheme] = useState<'royal_dark' | 'ivory_gold'>('ivory_gold');
  const plaqueRef = useRef<HTMLDivElement>(null);

  // Dynamic Tier Colors and Badging
  const tierConfig = {
    1: {
      name: "عامل فروش رسمی",
      levelText: "سطح ۱",
      accentGrad: "from-amber-400 via-amber-300 to-yellow-500",
      borderGrad: "from-amber-500 via-yellow-300 to-amber-600",
      ribbonBg: "bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600",
      glowColor: "rgba(245, 158, 11, 0.25)",
      sealGrad: "from-amber-500 via-yellow-400 to-amber-600",
      tagline: "احراز عاملیت فروش رسمی و تعهد توزیع استاندارد کارخانجات کشور",
      contractTitle: "قرارداد رسمی عاملیت فروش خطوط تولید (سطح ۱)",
      discountRate: "۵٪ الی ۱۰٪ تخفیف مازاد عاملیت"
    },
    2: {
      name: "نماینده انحصاری شهر",
      levelText: "سطح ۲",
      accentGrad: "from-sky-400 via-blue-300 to-indigo-400",
      borderGrad: "from-blue-400 via-sky-200 to-indigo-500",
      ribbonBg: "bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800",
      glowColor: "rgba(59, 130, 246, 0.25)",
      sealGrad: "from-blue-600 via-indigo-500 to-blue-700",
      tagline: "حق عاملیت انحصاری و اولویت اول تخصیص بار کارخانجات در محدوده شهری",
      contractTitle: "حکم انحصار توزیع شهری و عاملیت پخش دست اول (سطح ۲)",
      discountRate: "۱۰٪ الی ۱۵٪ تخفیف مازاد عاملیت"
    },
    3: {
      name: "نماینده انحصاری شهرستان و حومه",
      levelText: "سطح ۳",
      accentGrad: "from-purple-400 via-fuchsia-300 to-indigo-400",
      borderGrad: "from-purple-500 via-fuchsia-300 to-purple-600",
      ribbonBg: "bg-gradient-to-r from-purple-800 via-purple-600 to-indigo-800",
      glowColor: "rgba(168, 85, 247, 0.25)",
      sealGrad: "from-purple-600 via-fuchsia-500 to-purple-800",
      tagline: "حق عاملیت انحصاری شهرستان، نرخ ترانزیت مستقیم و مدیریت ویزیتوران منطقه",
      contractTitle: "پیمان انحصاری توزیع شهرستان و حومه با نرخ ترانزیت مستقیم (سطح ۳)",
      discountRate: "۱۵٪ الی ۱۸٪ تخفیف مازاد عاملیت"
    },
    4: {
      name: "نماینده ارشد استانی و لیدر فروش",
      levelText: "سطح ۴",
      accentGrad: "from-emerald-300 via-teal-200 to-yellow-300",
      borderGrad: "from-emerald-400 via-yellow-300 to-teal-500",
      ribbonBg: "bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-900",
      glowColor: "rgba(16, 185, 129, 0.3)",
      sealGrad: "from-emerald-600 via-teal-500 to-emerald-700",
      tagline: "رهبری عالی شبکه توزیع استانی، حق اورراید منطقه‌ای و عضویت در شورای تامین",
      contractTitle: "حکم انتصاب نماینده ارشد استانی و لیدر شبکه توزیع سراسری (سطح ۴)",
      discountRate: "۲۰٪ الی ۲۵٪ تخفیف حداکثری دست اول"
    }
  }[tierLevel as 1 | 2 | 3 | 4] || {
    name: "عامل فروش رسمی",
    levelText: `سطح ${toPersianNum(tierLevel)}`,
    accentGrad: "from-amber-400 via-amber-300 to-yellow-500",
    borderGrad: "from-amber-500 via-yellow-300 to-amber-600",
    ribbonBg: "bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600",
    glowColor: "rgba(245, 158, 11, 0.25)",
    sealGrad: "from-amber-500 via-yellow-400 to-amber-600",
    tagline: "احراز عاملیت رسمی شبکه سراسری کالا",
    contractTitle: "قرارداد رسمی عاملیت توزیع مستقیم کالا",
    discountRate: "۵٪ الی ۱۰٪ تخفیف مازاد عاملیت"
  };

  const handleDownloadPng = async () => {
    if (!plaqueRef.current) return;
    try {
      setIsDownloadingPng(true);
      await new Promise((resolve) => setTimeout(resolve, 80));

      let dataUrl = "";
      try {
        dataUrl = await toPng(plaqueRef.current, {
          quality: 1,
          pixelRatio: 3,
          backgroundColor: plaqueTheme === 'royal_dark' ? "#0b1329" : "#fcfbf9",
          cacheBust: true,
        });
      } catch {
        dataUrl = await toJpeg(plaqueRef.current, {
          quality: 0.98,
          pixelRatio: 2.5,
          backgroundColor: plaqueTheme === 'royal_dark' ? "#0b1329" : "#fcfbf9",
          cacheBust: true,
        });
      }

      if (!dataUrl) throw new Error("Image export failed");

      const link = document.createElement("a");
      link.download = `لوح_افتخار_رسمی_${agencyCode}_سطح_${tierLevel}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error downloading plaque image:", err);
      alert("خطا در ایجاد تصویر. لطفاً از دکمه دانلود PDF یا پرینت استفاده فرمایید.");
    } finally {
      setIsDownloadingPng(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!plaqueRef.current) return;
    try {
      setIsDownloadingPdf(true);
      await new Promise((resolve) => setTimeout(resolve, 80));

      let imgData = "";
      try {
        imgData = await toPng(plaqueRef.current, {
          pixelRatio: 3,
          backgroundColor: plaqueTheme === 'royal_dark' ? "#0b1329" : "#fcfbf9",
          cacheBust: true,
        });
      } catch {
        imgData = await toJpeg(plaqueRef.current, {
          quality: 0.98,
          pixelRatio: 2.5,
          backgroundColor: plaqueTheme === 'royal_dark' ? "#0b1329" : "#fcfbf9",
          cacheBust: true,
        });
      }

      if (!imgData) throw new Error("PDF export failed");

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pdfWidth = 297;
      const pdfHeight = 210;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

      pdf.save(`سند_گواهی_نمایندگی_دست_اول_${agencyCode}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      if (onOpenPdfModal) {
        onOpenPdfModal();
      } else {
        alert("خطا در تولید PDF مستقیم. پنجره مشاهده گواهی باز می‌گردد.");
      }
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const shareUrl = `${window.location.origin}/verify-agency/${agencyCode}`;
  const shareText = `گواهی و لوح رسمی عاملیت دست اول | کد عاملیت: ${agencyCode} | دفتر: ${companyName} | رتبه: ${tierConfig.levelText} (${badgeLabel}) | منطقه انحصاری: ${province} - ${city}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${shareText}\nلینک استعلام: ${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-5 font-sans text-right" dir="rtl">
      
      {/* ========================================================================= */}
      {/* 1. MODERN ACTION HUB & DOCUMENT SWITCHER                                   */}
      {/* ========================================================================= */}
      <motion.div 
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        {/* Left: Document Tabs Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveDocTab('plaque')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeDocTab === 'plaque'
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Award size={15} className="text-amber-400" />
            <span>🏆 لوح تقدیر و افتخار</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDocTab('contract')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeDocTab === 'contract'
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText size={15} className="text-indigo-400" />
            <span>📄 حکم و قرارداد رسمی عاملیت</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDocTab('license')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeDocTab === 'license'
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldCheck size={15} className="text-emerald-400" />
            <span>🛡️ پروانه اصالت و QR استعلام</span>
          </button>
        </div>

        {/* Right: Actions (PDF, PNG, Share) */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          
          {/* Theme Selector for Plaque */}
          {activeDocTab === 'plaque' && (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setPlaqueTheme('royal_dark')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  plaqueTheme === 'royal_dark'
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🌌 سرمه‌ای سلطنتی
              </button>
              <button
                type="button"
                onClick={() => setPlaqueTheme('ivory_gold')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  plaqueTheme === 'ivory_gold'
                    ? "bg-white text-slate-900 shadow-xs font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                📜 عاجی زرین
              </button>
            </div>
          )}

          {/* Share Documents Button */}
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black rounded-xl border border-indigo-200/80 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Share2 size={15} />
            <span>به اشتراک‌گذاری مدارک</span>
          </button>

          {/* Download PNG */}
          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={isDownloadingPng}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            title="دانلود تصویر لوح با کیفیت ۳۰۰ DPI"
          >
            {isDownloadingPng ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            <span>{isDownloadingPng ? "در حال پردازش..." : "تصویر PNG"}</span>
          </button>

          {/* Download Official PDF */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-amber-500/20 disabled:opacity-60"
          >
            {isDownloadingPdf ? (
              <Loader2 size={15} className="animate-spin text-slate-950" />
            ) : (
              <Download size={15} className="text-slate-950" />
            )}
            <span>{isDownloadingPdf ? "در حال صدور PDF..." : "دانلود PDF رسمی"}</span>
          </button>

        </div>
      </motion.div>

      {/* ========================================================================= */}
      {/* 2. TAB 1: LUXURY HONOR PLAQUE / CERTIFICATE CONTAINER                      */}
      {/* ========================================================================= */}
      {activeDocTab === 'plaque' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
        >
          <div
            ref={plaqueRef}
            id="honor-plaque-canvas"
            className={`w-full rounded-3xl p-6 sm:p-10 relative overflow-hidden transition-all duration-300 select-none ${
              plaqueTheme === 'royal_dark'
                ? "bg-[#0b1329] text-slate-100 shadow-2xl border-[10px] border-[#182344]"
                : "bg-[#fcfbf9] text-slate-900 shadow-xl border-[10px] border-[#e7dec8]"
            }`}
            style={{
              boxShadow: `0 25px 50px -12px ${tierConfig.glowColor}, inset 0 0 40px rgba(0,0,0,0.08)`
            }}
          >
            {/* Background Islamic / Luxury Filigree Pattern */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-[0.06]"
              style={{
                backgroundImage: `radial-gradient(circle at 50% 50%, #d4af37 1px, transparent 1px), radial-gradient(circle at 0 0, #d4af37 1px, transparent 1px)`,
                backgroundSize: '28px 28px'
              }}
            />

            {/* Intricate Luxury Double Gold Border */}
            <div className={`absolute inset-3 sm:inset-4 rounded-2xl border-2 pointer-events-none ${
              plaqueTheme === 'royal_dark' ? "border-amber-400/40" : "border-amber-700/30"
            }`} />
            <div className={`absolute inset-5 sm:inset-6 rounded-xl border pointer-events-none ${
              plaqueTheme === 'royal_dark' ? "border-amber-300/20" : "border-amber-600/20"
            }`} />

            {/* 4 Golden Corner Ornaments */}
            <div className="absolute top-4 right-4 sm:top-5 sm:right-5 w-10 h-10 border-t-2 border-r-2 border-amber-400 rounded-tr-lg pointer-events-none flex items-start justify-end p-1">
              <div className="w-2 h-2 bg-amber-400 rotate-45" />
            </div>
            <div className="absolute top-4 left-4 sm:top-5 sm:left-5 w-10 h-10 border-t-2 border-l-2 border-amber-400 rounded-tl-lg pointer-events-none flex items-start justify-start p-1">
              <div className="w-2 h-2 bg-amber-400 rotate-45" />
            </div>
            <div className="absolute bottom-4 right-4 sm:bottom-5 sm:right-5 w-10 h-10 border-b-2 border-r-2 border-amber-400 rounded-br-lg pointer-events-none flex items-end justify-end p-1">
              <div className="w-2 h-2 bg-amber-400 rotate-45" />
            </div>
            <div className="absolute bottom-4 left-4 sm:bottom-5 sm:left-5 w-10 h-10 border-b-2 border-l-2 border-amber-400 rounded-bl-lg pointer-events-none flex items-end justify-start p-1">
              <div className="w-2 h-2 bg-amber-400 rotate-45" />
            </div>

            {/* CONTENT STACK */}
            <div className="relative z-10 space-y-6 sm:space-y-7">
              
              {/* Top Header Bar: Official Insignia & Registry Metadata */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-5 relative border-amber-400/20">
                
                {/* Right: Registry Code & Date */}
                <div className="text-right space-y-1 w-full sm:w-auto">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold opacity-80">
                    <ShieldCheck size={14} className="text-amber-400" />
                    <span>شناسه رسمی عاملیت:</span>
                    <span className="font-mono font-black text-amber-300 text-xs px-2 py-0.5 rounded bg-black/20 border border-amber-400/20">
                      {toPersianNum(agencyCode || "REP-7012")}
                    </span>
                  </div>
                  <div className="text-[10px] opacity-70">
                    تاریخ صدور و اعطا: <span className="font-mono font-bold">{toPersianNum(promotionDate)}</span>
                  </div>
                </div>

                {/* Center: Official Seal Emblem */}
                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-[1px] w-8 sm:w-12 bg-gradient-to-r from-transparent to-amber-400" />
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/30 text-slate-950 font-black">
                      <Star size={16} fill="currentColor" />
                    </div>
                    <div className="h-[1px] w-8 sm:w-12 bg-gradient-to-l from-transparent to-amber-400" />
                  </div>
                  <span className="text-[10px] tracking-[0.25em] uppercase font-black text-amber-400">
                    DASTAVVAL PLATFORM
                  </span>
                  <h4 className="text-xs sm:text-sm font-black tracking-wide">
                    سامانه سراسری و مرجع معاملات مستقیم کالا
                  </h4>
                </div>

                {/* Left: Region & Official Online Authenticity */}
                <div className="text-left space-y-1 w-full sm:w-auto">
                  <div className="text-[11px] font-bold">
                    منطقه استحفاظی: <span className="text-amber-300 font-black">{province} - {city}</span>
                  </div>
                  <div className="text-[10px] text-emerald-400 font-black flex items-center justify-start sm:justify-end gap-1">
                    <CheckCircle2 size={12} />
                    <span>استعلام آنلاین: معتبر و فعال در بانک نمایندگان</span>
                  </div>
                </div>
              </div>

              {/* Central Ribbon & Plaque Main Title */}
              <div className="text-center space-y-3">
                
                {/* Ribbon Badge */}
                <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full text-xs font-black text-white shadow-lg border border-white/20"
                  style={{
                    background: tierLevel === 4 
                      ? "linear-gradient(135deg, #065f46 0%, #047857 50%, #064e3b 100%)" 
                      : tierLevel === 3
                      ? "linear-gradient(135deg, #581c87 0%, #7e22ce 50%, #3b0764 100%)"
                      : tierLevel === 2
                      ? "linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #172554 100%)"
                      : "linear-gradient(135deg, #78350f 0%, #b45309 50%, #451a03 100%)"
                  }}
                >
                  <Sparkles size={14} className="text-yellow-300" />
                  <span>لوح افتخار و حکم احراز رتبه رسمی عاملیت توزیع</span>
                  <Sparkles size={14} className="text-yellow-300" />
                </div>

                {/* Company / Office Name in Prominent Display */}
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight pt-1">
                  <span className={`bg-clip-text text-transparent bg-gradient-to-r ${tierConfig.accentGrad}`}>
                    {companyName || "دفتر عاملیت و پخش منطقه‌ای"}
                  </span>
                </h2>

                {/* Recipient Agent Name */}
                <div className="flex justify-center items-center gap-2 pt-1">
                  <span className="text-xs sm:text-sm font-medium opacity-80">مدیریت ارجمند و کارآفرین محترم:</span>
                  <span className="text-sm sm:text-base font-black px-3 py-0.5 rounded-lg border-b-2 border-amber-400 bg-amber-400/10">
                    جناب آقای / سرکار خانم {repName || "مدیریت عاملیت"}
                  </span>
                </div>
              </div>

              {/* Achievement Frame / Official Certification Text */}
              <div className={`rounded-2xl p-5 sm:p-6 border relative overflow-hidden text-center space-y-3 ${
                plaqueTheme === 'royal_dark'
                  ? "bg-gradient-to-b from-[#131f42]/90 to-[#0d1630]/90 border-amber-400/30 text-slate-200"
                  : "bg-gradient-to-b from-[#fffefc] to-[#f4eee1] border-amber-600/30 text-slate-800"
              }`}>
                
                <p className="text-xs sm:text-sm leading-relaxed font-medium max-w-2xl mx-auto">
                  بدین‌وسیله گواهی می‌شود بر اساس ارزیابی عملکرد تجاری، انضباط مالی و دستیابی به سقف تعهدات فروش، مجموعه فوق با احراز رکورد فروش در شبکه سراسری به رتبه رسمی زیر مفتخر گردیده است:
                </p>

                {/* Large Rank Title Banner */}
                <div className="py-2">
                  <div className="inline-block px-6 sm:px-10 py-2.5 sm:py-3 rounded-2xl border-2 shadow-xl"
                    style={{
                      background: plaqueTheme === 'royal_dark'
                        ? "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(251,191,36,0.05) 100%)"
                        : "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                      borderColor: "#d97706"
                    }}
                  >
                    <span className="text-base sm:text-xl font-black text-amber-500 tracking-wide block">
                      🌟 {badgeLabel || tierConfig.name} ({tierConfig.levelText}) 🌟
                    </span>
                    <span className="text-[11px] font-bold opacity-80 block pt-0.5">
                      منطقه انحصاری: {province} - {city}
                    </span>
                  </div>
                </div>

                {/* Performance Volume & Benefit Rights */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold pt-1">
                  <div className="px-3 py-1.5 rounded-xl bg-black/20 border border-amber-400/20">
                    <span>فروش محقق‌شده: </span>
                    <strong className="font-mono text-amber-400 text-sm font-black">
                      {monthlySales > 0 ? `${toPersianNum(monthlySales.toLocaleString('fa-IR'))} تومان` : "حد نصاب اولیه ۳۰۰ میلیون تومان"}
                    </strong>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-black/20 border border-amber-400/20 text-emerald-400">
                    <span>تخفیف ویژه عاملیت کارخانجات: </span>
                    <strong className="font-mono text-sm font-black">فعال و تاییدشده ({tierConfig.discountRate})</strong>
                  </div>
                </div>

                <p className="text-[11px] sm:text-xs opacity-80 leading-relaxed max-w-xl mx-auto pt-1">
                  {tierConfig.tagline} به این دفتر واگذار گردیده و مشخصات ایشان جهت استعلام عمده‌فروشان در سامانه کشوری ثبت شد.
                </p>
              </div>

              {/* Lower Stamp, Signatures & Digital Security QR */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-3 border-t border-amber-400/20">
                
                {/* Left: Security QR & Barcode */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start">
                  <div className="w-14 h-14 bg-white rounded-xl p-1.5 border-2 border-amber-400/60 shadow-md flex items-center justify-center shrink-0">
                    <QrCode size={44} className="text-slate-900" />
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-[10px] font-black text-amber-400 block">گواهی الکترونیک ضدجعل</span>
                    <span className="text-[10px] font-mono opacity-80 block">VERIFIED-REP-{toPersianNum(agencyCode)}</span>
                    <span className="text-[9px] text-emerald-400 font-bold block">دارای امضای دیجیتال SHA-256</span>
                  </div>
                </div>

                {/* Center: 3D Wax Seal & Gold Trophy Medal */}
                <div className="flex flex-col items-center text-center">
                  <div className="relative flex items-center justify-center">
                    {/* Gold Seal Circle */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-600 via-amber-300 to-yellow-500 border-4 border-amber-200 shadow-xl flex items-center justify-center text-slate-950 rotate-[-6deg] ring-4 ring-amber-400/20">
                      <Award size={32} />
                    </div>
                    {/* Decorative ribbons below seal */}
                    <div className="absolute -bottom-2 -left-1 w-4 h-6 bg-amber-700 rotate-[25deg] -z-10 rounded-b" />
                    <div className="absolute -bottom-2 -right-1 w-4 h-6 bg-amber-700 rotate-[-25deg] -z-10 rounded-b" />
                  </div>
                  <span className="text-[10px] font-black text-amber-400 mt-2">نشان طلایی اصالت دست اول</span>
                </div>

                {/* Right: Signature & Stamp of Headquarters */}
                <div className="text-center sm:text-left space-y-1 w-full sm:w-auto flex flex-col items-center sm:items-end">
                  <span className="text-[11px] font-black opacity-90 block">شورای اعطای عاملیت و نظارت بر شبکه</span>
                  <div className="h-12 relative flex items-center justify-center">
                    {/* Official Circular Stamp */}
                    <div className="w-24 h-12 border-2 border-dashed border-indigo-400/80 rounded-xl bg-indigo-500/10 text-[9px] text-indigo-300 font-black flex items-center justify-center rotate-[-4deg] p-1 shadow-xs">
                      <span>تایید و ثبت نهایی شد ✓</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* 3. TAB 2: OFFICIAL AGENCY AGREEMENT (قرارداد و حکم رسمی)                   */}
      {/* ========================================================================= */}
      {activeDocTab === 'contract' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-6 text-slate-800"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div className="space-y-1">
              <span className="text-[10px] font-black tracking-widest text-indigo-600 uppercase">DASTAVVAL LEGAL CONTRACT</span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                {tierConfig.contractTitle}
              </h3>
            </div>
            <div className="text-left space-y-1">
              <span className="text-xs font-mono font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                شماره قرارداد: {toPersianNum(agencyCode)}/ق/۱۴۰۵
              </span>
              <span className="text-[10px] text-slate-500 font-bold block">تاریخ ثبت حقوقی: {toPersianNum(promotionDate)}</span>
            </div>
          </div>

          {/* Contract Clauses */}
          <div className="space-y-4 text-xs leading-relaxed font-medium text-slate-700 bg-slate-50/70 p-6 rounded-2xl border border-slate-100">
            <div className="space-y-1">
              <strong className="text-slate-900 font-black block">ماده ۱ - طرفین قرارداد:</strong>
              <p>
                این قرارداد فی‌مابین پلتفرم معاملات مستقیم کارخانجات «دست اول» به عنوان کارگزار ارشد و مجموعه تجاری <strong>{companyName}</strong> به مدیریت محترم <strong>{repName}</strong> به عنوان عامل رسمی در منطقه <strong>{province} - {city}</strong> منعقد گردید.
              </p>
            </div>

            <div className="space-y-1">
              <strong className="text-slate-900 font-black block">ماده ۲ - موضوع و حقوق انحصاری عاملیت:</strong>
              <p>
                تفویض حق عاملیت فروش و توزیع مستقیم محصولات کارخانجات همکار با نرخ مصوب درب کارخانه، اعمال تخفیف مازاد عاملیت به میزان <strong>{tierConfig.discountRate}</strong> و اولویت اول بارگیری و ترانزیت مستقیم بار به انبار نماینده.
              </p>
            </div>

            <div className="space-y-1">
              <strong className="text-slate-900 font-black block">ماده ۳ - تعهدات و حد نصاب فروش:</strong>
              <p>
                عامل موظف به حفظ کیفیت توزیع مویرگی و تامین پایدار نیاز بنکداران و فروشگاه‌های منطقه بوده و با حفظ سقف فروش مربوطه، کلیه حقوق انحصاری و کمیسیون‌های منطقه‌ای تداوم خواهد داشت.
              </p>
            </div>
          </div>

          {/* Signatures & Seals Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-2">
              <span className="text-[11px] font-black text-slate-500 block">مهر و امضای عامل رسمی (طرف دوم)</span>
              <div className="text-xs font-black text-slate-900">{companyName}</div>
              <div className="text-[11px] text-slate-600 font-bold">{repName}</div>
              <div className="pt-2 text-[10px] text-emerald-700 font-black">امضای دیجیتال ثبت گردید ✓</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-2">
              <span className="text-[11px] font-black text-slate-500 block">مهر و امضای دبیرخانه مرکزی پلتفرم (طرف اول)</span>
              <div className="text-xs font-black text-slate-900">سامانه سراسری دست اول</div>
              <div className="text-[11px] text-slate-600 font-bold">واحد امور حقوقی و شبکه توزیع</div>
              <div className="pt-2 text-[10px] text-indigo-700 font-black">هولوگرام اصالت و مهر برجسته الکترونیکی ✓</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB 3: DISTRIBUTION LICENSE & VERIFIED QR (پروانه فعالیت و اصالت)        */}
      {/* ========================================================================= */}
      {activeDocTab === 'license' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-6 text-slate-800"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-black">
                <ShieldCheck size={26} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">پروانه احراز صلاحیت و مجوز عاملیت رسمی</h3>
                <p className="text-xs text-slate-500 font-medium">استعلام آنی اصالت از طریق اسکن بارکد QR</p>
              </div>
            </div>

            <span className="text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-xl">
              وضعیت پروانه: معتبر و فعال 🟢
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* QR Card */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col items-center text-center space-y-3">
              <div className="w-36 h-36 bg-white rounded-2xl p-2.5 border-2 border-indigo-200 shadow-md flex items-center justify-center">
                <QrCode size={120} className="text-slate-900" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-black text-slate-900 block">اسکن جهت تایید آنلاین</span>
                <span className="text-[10px] text-slate-500 font-mono font-bold block">VERIFY-{agencyCode}</span>
              </div>
            </div>

            {/* License Details */}
            <div className="md:col-span-2 space-y-3.5 text-xs bg-slate-50/70 p-6 rounded-2xl border border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-bold block text-[11px]">دارنده مجوز:</span>
                  <span className="text-slate-900 font-black text-sm">{companyName}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-bold block text-[11px]">مدیریت عاملیت:</span>
                  <span className="text-slate-900 font-black text-sm">{repName}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-bold block text-[11px]">محدوده استحفاظی توزیع:</span>
                  <span className="text-indigo-700 font-black text-sm">{province} - {city}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-bold block text-[11px]">رتبه احراز صلاحیت:</span>
                  <span className="text-emerald-700 font-black text-sm">{badgeLabel} ({tierConfig.levelText})</span>
                </div>
              </div>

              <div className="border-t border-slate-200/80 pt-3 text-[11px] text-slate-600 leading-relaxed font-medium">
                این گواهی‌نامه صلاحیت تجاری، دارنده را به عنوان نماینده رسمی کارخانجات عضو سامانه دست اول معرفی نموده و خریداران عمده و بنکداران منطقه می‌توانند با اطمینان کامل از ضمانت پرداخت و کیفیت کالا اقدام به ثبت سفارش نمایند.
              </div>
            </div>

          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* 5. SHARE DOCUMENTS MODAL                                                  */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-400/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 text-right"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                    <Share2 size={16} />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">
                    به اشتراک‌گذاری مدارک و لوح عاملیت
                  </h4>
                </div>
                <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                با ارسال این پیوند، مشتریان، بنکداران و شرکای تجاری شما می‌توانند تصویر لوح، حکم انحصاری و استعلام صلاحیت شما را به صورت آنلاین مشاهده نمایند:
              </p>

              {/* Share Summary Card */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1.5 font-bold">
                <div className="text-slate-900">دفتر عاملیت: {companyName}</div>
                <div className="text-indigo-600 font-mono">کد استعلام: {toPersianNum(agencyCode)}</div>
                <div className="text-emerald-700">رتبه: {badgeLabel} ({tierConfig.levelText})</div>
              </div>

              {/* Link Copy Box */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500">لینک اختصاصی استعلام اصالت:</label>
                <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="w-full bg-transparent px-2 text-xs font-mono text-slate-700 outline-none text-left"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? "کپی شد" : "کپی لینک"}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  بستن
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
