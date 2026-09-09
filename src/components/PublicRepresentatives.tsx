import React, { useEffect, useState, useRef, useMemo } from "react";
import { 
  Award, 
  MapPin, 
  Building, 
  ShieldCheck, 
  Phone, 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  TrendingUp, 
  Coins, 
  Users, 
  ArrowLeft, 
  Sparkles,
  Building2,
  CheckCircle2,
  LayoutGrid,
  SlidersHorizontal,
  Share2,
  Check,
  Globe2,
  Filter,
  Package,
  X,
  FileText,
  Printer,
  Download,
  ExternalLink,
  Tag,
  Briefcase,
  Crown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { toPng, toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";
import { calculateDealershipTier, formatTomanCurrency, findNearestRepresentative, getProvinceForCity } from "../utils/dealershipCityTiers";
import { isWarehouseBrand } from "../utils/api-utils";
import RepresentativeShareLicenseModal from "./RepresentativeShareLicenseModal";

interface PublicRepresentativesProps {
  theme?: 'light' | 'dark' | 'classic';
  userBadge?: string;
  userCity?: string;
  b2bConfig?: any;
  products?: any[];
  onOpenDealershipModal?: () => void;
}

export default function PublicRepresentatives({
  theme = 'light',
  userBadge,
  userCity,
  b2bConfig,
  products = [],
  onOpenDealershipModal
}: PublicRepresentativesProps) {
  const [representatives, setRepresentatives] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [selectedRepForDetails, setSelectedRepForDetails] = useState<any | null>(null);
  const [modalTab, setModalTab] = useState<'profile' | 'certificate'>('profile');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [shareModalRep, setShareModalRep] = useState<any | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const certificateRef = useRef<HTMLDivElement>(null);

  // Dynamically extract all real site brands from catalog products & factories
  const siteRealBrands = useMemo(() => {
    const brandSet = new Set<string>();

    if (products && Array.isArray(products)) {
      products.forEach((p: any) => {
        if (p?.brand && typeof p.brand === 'string' && !isWarehouseBrand(p.brand)) {
          brandSet.add(p.brand.trim());
        }
      });
    }

    if (b2bConfig?.factories && Array.isArray(b2bConfig.factories)) {
      b2bConfig.factories
        .filter((f: any) => f && f.isActive !== false)
        .forEach((f: any) => {
        if (f?.name && typeof f.name === 'string' && !isWarehouseBrand(f.name)) {
          brandSet.add(f.name.trim());
        }
      });
    }

    if (b2bConfig?.brands && Array.isArray(b2bConfig.brands)) {
      b2bConfig.brands.forEach((b: any) => {
        const bName = typeof b === 'string' ? b : b?.name;
        if (bName && typeof bName === 'string' && !isWarehouseBrand(bName)) {
          brandSet.add(bName.trim());
        }
      });
    }

    return Array.from(brandSet);
  }, [products, b2bConfig]);

  const loadRepresentatives = () => {
    try {
      // 1. Load from admin representatives database
      const savedReps: any[] = JSON.parse(localStorage.getItem("dastavval_representatives") || "[]");
      
      // 2. Load from local registered users who have been approved
      const localUsers = JSON.parse(localStorage.getItem("dastavval_local_users") || "{}");
      const approvedLocalUsers = Object.values(localUsers).filter((u: any) => {
        const isApproved = 
          u.agencyApproved === true || 
          u.isRepresentativeApproved === true || 
          u.representativeApproved === true ||
          (u.phone && localStorage.getItem(`dastavval_rep_approved_${u.phone}`) === "true") ||
          (u.id && localStorage.getItem(`dastavval_rep_approved_${u.id}`) === "true");
        return isApproved && (u.role === 'representative' || u.role === 'agency');
      });

      // Merge unique by phone/email/id
      const combined = [...savedReps];
      approvedLocalUsers.forEach((u: any) => {
        const exists = combined.some(r => (r.phone && r.phone === u.phone) || (r.id && r.id === u.id));
        if (!exists) {
          combined.push({
            id: u.id || `rep-${u.phone}`,
            name: u.displayName || u.name || "نماینده رسمی",
            company: u.company || u.agencyName || "دفتر عاملیت توزیع",
            city: u.city || u.agencyCity || "تهران",
            province: u.province || u.agencyProvince || "تهران",
            address: u.address || u.agencyAddress || `دفتر مرکزی توزیع در ${u.city || 'استان'}`,
            phone: u.phone || u.mobile || "۰۹۹۹۹۱۲۳۰۰۱",
            tel: u.phone || "۰۹۹۹۹۱۲۳۰۰۱",
            isApproved: true,
            status: 'active',
            badgeTitle: u.repBadgeTitle || 'نشان امین',
            badgeLevel: u.repBadgeLevel || 'gold',
            agencyCode: u.agencyCode || `AGN-1405-${Math.floor(1000 + Math.random() * 9000)}`,
            brands: u.brands || []
          });
        }
      });

      // Ensure every rep has valid brands array and agency code, using real site brands as fallback
      const processed = combined
        .filter(r => r.isApproved !== false && (r.status === 'active' || !r.status))
        .map((r, index) => {
          let repBrands = Array.isArray(r.brands) ? r.brands.filter((b: string) => b && !isWarehouseBrand(b)) : [];
          if (repBrands.length === 0) {
            if (siteRealBrands.length > 0) {
              const b1 = siteRealBrands[index % siteRealBrands.length];
              const b2 = siteRealBrands[(index + 1) % siteRealBrands.length];
              const b3 = siteRealBrands[(index + 2) % siteRealBrands.length];
              repBrands = Array.from(new Set([b1, b2, b3].filter(Boolean)));
            } else {
              repBrands = ["عاملیت توزیع صنایع غذایی"];
            }
          }
          return {
            ...r,
            brands: repBrands,
            agencyCode: r.agencyCode || `AGN-1405-${1000 + (index * 137) % 8999}`
          };
        });

      setRepresentatives(processed);
    } catch (e) {
      console.warn("Failed to load representatives:", e);
    }
  };

  useEffect(() => {
    loadRepresentatives();
    const handleUpdate = () => loadRepresentatives();
    window.addEventListener("dastavval_reps_updated", handleUpdate);
    return () => window.removeEventListener("dastavval_reps_updated", handleUpdate);
  }, [siteRealBrands]);

  // Popular / Key provinces for quick filter tabs
  const availableProvinces = useMemo(() => {
    const provSet = new Set<string>();
    representatives.forEach(r => {
      if (r.province) provSet.add(r.province.trim());
    });
    return Array.from(provSet);
  }, [representatives]);

  // Extract all distinct represented brands for filter
  const availableBrands = useMemo(() => {
    const brandSet = new Set<string>();

    // 1. Brands from representatives
    representatives.forEach(r => {
      if (Array.isArray(r.brands)) {
        r.brands.forEach((b: string) => {
          if (b && typeof b === 'string' && !isWarehouseBrand(b)) brandSet.add(b.trim());
        });
      }
    });

    // 2. Brands from b2bConfig
    if (b2bConfig?.brands && Array.isArray(b2bConfig.brands)) {
      b2bConfig.brands.forEach((b: any) => {
        const bName = typeof b === 'string' ? b : b?.name;
        if (bName && typeof bName === 'string' && !isWarehouseBrand(bName)) brandSet.add(bName.trim());
      });
    }

    // 3. Brands from b2bConfig factories
    if (b2bConfig?.factories && Array.isArray(b2bConfig.factories)) {
      b2bConfig.factories.forEach((f: any) => {
        if (f?.name && typeof f.name === 'string' && !isWarehouseBrand(f.name)) brandSet.add(f.name.trim());
      });
    }

    // 4. Brands from catalog products
    if (products && Array.isArray(products)) {
      products.forEach((p: any) => {
        if (p?.brand && typeof p.brand === 'string' && !isWarehouseBrand(p.brand)) brandSet.add(p.brand.trim());
      });
    }

    siteRealBrands.forEach(b => {
      if (!isWarehouseBrand(b)) brandSet.add(b);
    });

    return Array.from(brandSet);
  }, [representatives, b2bConfig, products, siteRealBrands]);

  const filteredReps = useMemo(() => {
    return representatives.filter((rep) => {
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch = !term || 
        rep.name?.toLowerCase().includes(term) ||
        rep.company?.toLowerCase().includes(term) ||
        rep.city?.toLowerCase().includes(term) ||
        rep.province?.toLowerCase().includes(term) ||
        rep.address?.toLowerCase().includes(term) ||
        (Array.isArray(rep.brands) && rep.brands.some((b: string) => b.toLowerCase().includes(term)));

      const matchesProvince = selectedProvince === 'all' || rep.province === selectedProvince;

      const matchesBrand = selectedBrand === 'all' || 
        (Array.isArray(rep.brands) && rep.brands.some((b: string) => b.trim().toLowerCase() === selectedBrand.toLowerCase()));

      return matchesSearch && matchesProvince && matchesBrand;
    });
  }, [representatives, searchTerm, selectedProvince, selectedBrand]);

  const nearestRepData = useMemo(() => {
    if (filteredReps.length > 0) return null;
    return findNearestRepresentative(searchTerm, selectedProvince, representatives);
  }, [filteredReps, searchTerm, selectedProvince, representatives]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 340;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleCopyPhone = (phoneNum: string) => {
    navigator.clipboard.writeText(phoneNum);
    setCopiedPhone(phoneNum);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleOpenDealership = (prefillCity?: string) => {
    const cityToPrefill = prefillCity || searchTerm || (selectedProvince !== 'all' ? selectedProvince : '');
    const provinceToPrefill = selectedProvince !== 'all' ? selectedProvince : '';

    // Dispatch global event for listeners across the app
    window.dispatchEvent(new CustomEvent("open-dealership-request", {
      detail: {
        city: cityToPrefill,
        province: provinceToPrefill
      }
    }));

    // Call prop callback if provided
    if (onOpenDealershipModal) {
      onOpenDealershipModal();
    }
  };

  const handleDownloadCertificatePdf = async () => {
    if (!certificateRef.current) return;
    try {
      setIsExportingPdf(true);
      await new Promise((resolve) => setTimeout(resolve, 80));

      if (document.fonts) {
        try { await document.fonts.ready; } catch (e) {}
      }

      const element = certificateRef.current;
      
      // Create an unclipped off-screen clone with dynamic full height capture
      const clone = element.cloneNode(true) as HTMLElement;
      clone.id = "public-certificate-clone-export";
      clone.style.position = "fixed";
      clone.style.left = "-9999px";
      clone.style.top = "0px";
      clone.style.width = "1050px";
      clone.style.height = "auto";
      clone.style.minWidth = "1050px";
      clone.style.minHeight = "742px";
      clone.style.maxWidth = "none";
      clone.style.maxHeight = "none";
      clone.style.transform = "none";
      clone.style.zIndex = "-9999";
      clone.style.boxSizing = "border-box";
      clone.style.overflow = "visible";

      document.body.appendChild(clone);
      await new Promise((resolve) => setTimeout(resolve, 150));

      const captureW = 1050;
      const captureH = Math.max(clone.scrollHeight, clone.offsetHeight, 742);

      let dataUrl = "";
      try {
        dataUrl = await toPng(clone, {
          width: captureW,
          height: captureH,
          quality: 0.98,
          pixelRatio: 2.5,
          backgroundColor: '#ffffff',
          cacheBust: true,
        });
      } catch (err) {
        dataUrl = await toJpeg(clone, {
          width: captureW,
          height: captureH,
          quality: 0.98,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          cacheBust: true,
        });
      } finally {
        if (document.body.contains(clone)) {
          document.body.removeChild(clone);
        }
      }

      if (!dataUrl) throw new Error("PNG conversion returned empty data");

      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(true);
      });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidth = 297;
      const pageHeight = 210;
      const margin = 5;
      const maxW = pageWidth - (margin * 2);
      const maxH = pageHeight - (margin * 2);

      const naturalW = img.naturalWidth || captureW;
      const naturalH = img.naturalHeight || captureH;
      const aspect = naturalW / naturalH;

      let renderW = maxW;
      let renderH = maxW / aspect;

      if (renderH > maxH) {
        renderH = maxH;
        renderW = maxH * aspect;
      }

      const posX = margin + (maxW - renderW) / 2;
      const posY = margin + (maxH - renderH) / 2;

      pdf.addImage(dataUrl, 'PNG', posX, posY, renderW, renderH, undefined, 'FAST');
      pdf.save(`Dastavval_Certificate_${selectedRepForDetails?.agencyCode || 'Representative'}.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <section id="public-representatives-section" className="py-8 md:py-12 bg-white text-right select-none font-sans" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* ========================================================================= */}
        {/* 1. SECTION HEADER (CLEAN WHITE THEME + SLIM TYPOGRAPHY)                   */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold border border-emerald-200/80 shadow-2xs">
                <Award size={15} className="text-emerald-500" />
                <span>شبکه سراسری نمایندگان مجاز</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <span>نمایندگان توزیع پلتفرم دست اول</span>
              </h2>

              <p className="text-[11px] text-slate-500 font-bold leading-relaxed max-w-2xl">
                توزیع مستقیم و ایمن تولیدات کارخانه به سراسر کشور با شروع منعطف از ۳۰ کارتن.
              </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 shrink-0">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center space-y-0.5">
                <span className="text-[10px] font-bold text-slate-500 block">استان‌های فعال</span>
                <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                  {availableProvinces.length > 0 ? availableProvinces.length : "۳۱"}
                </span>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center space-y-0.5">
                <span className="text-[10px] font-bold text-emerald-800 block">عاملیت رسمی</span>
                <span className="text-base sm:text-lg font-black text-emerald-900 font-mono">
                  {representatives.length}+
                </span>
              </div>

              <div className="col-span-2 sm:col-span-1 bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center space-y-0.5">
                <span className="text-[10px] font-bold text-amber-800 block">شروع ورود</span>
                <span className="text-xs font-black text-amber-900">از ۲۰ تا ۳۰ کارتن</span>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. FILTER CONTROLS, SEARCH & BRAND FILTER BAR                             */}
        {/* ========================================================================= */}
        <div className="space-y-3.5 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs">
          
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Live Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجوی نماینده، برند، شهر، استان یا آدرس..."
                className="w-full py-2.5 pr-10 pl-9 rounded-2xl text-xs font-bold border transition-all outline-hidden bg-slate-50/60 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* View Mode Switcher & Carousel Arrows */}
            <div className="flex items-center justify-between sm:justify-end gap-2.5">
              
              {/* Layout Switcher */}
              <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
                <button
                  onClick={() => setViewMode('carousel')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'carousel' 
                      ? "bg-white text-emerald-800 shadow-2xs font-black" 
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="نمایش چرخشی افقی"
                >
                  <SlidersHorizontal size={13} />
                  <span className="hidden sm:inline">چرخشی</span>
                </button>

                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'grid' 
                      ? "bg-white text-emerald-800 shadow-2xs font-black" 
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="نمایش شبکه‌ای کامل"
                >
                  <LayoutGrid size={13} />
                  <span className="hidden sm:inline">شبکه‌ای</span>
                </button>
              </div>

              {/* Carousel Scroll Controls (Active in carousel mode) */}
              {viewMode === 'carousel' && (
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => scroll('right')}
                    className="w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer border-slate-200 bg-white text-slate-700 hover:text-emerald-600 hover:bg-slate-50 shadow-2xs active:scale-95"
                    title="نماینده بعدی"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <button
                    onClick={() => scroll('left')}
                    className="w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer border-slate-200 bg-white text-slate-700 hover:text-emerald-600 hover:bg-slate-50 shadow-2xs active:scale-95"
                    title="نماینده قبلی"
                  >
                    <ChevronLeft size={18} />
                  </button>
                </div>
              )}

            </div>

          </div>

          {/* Province Filter Chips Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar select-none" style={{ scrollbarWidth: 'none' }}>
              <span className="text-[10.5px] font-black text-slate-400 shrink-0 ml-1">استان:</span>
              <button
                onClick={() => setSelectedProvince('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                  selectedProvince === 'all'
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs font-black"
                    : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
                }`}
              >
                همه استان‌ها ({representatives.length})
              </button>

              {availableProvinces.map((prov, pIdx) => {
                const count = representatives.filter(r => r.province === prov).length;
                return (
                  <button
                    key={`prov-chip-${prov}-${pIdx}`}
                    onClick={() => setSelectedProvince(prov)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                      selectedProvince === prov
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs font-black"
                        : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
                    }`}
                  >
                    {prov} <span className="text-[10px] opacity-75 font-normal">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Brand Filter Chips Bar (Requested Feature) */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar select-none" style={{ scrollbarWidth: 'none' }}>
              <span className="text-[10.5px] font-black text-slate-400 shrink-0 ml-1 flex items-center gap-1">
                <Tag size={12} className="text-emerald-600" />
                <span>برند عاملیت:</span>
              </span>
              <button
                onClick={() => setSelectedBrand('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                  selectedBrand === 'all'
                    ? "bg-slate-900 text-white border-slate-900 shadow-2xs font-black"
                    : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
                }`}
              >
                همه برندها
              </button>

              {availableBrands.map((brandName, bIdx) => {
                const count = representatives.filter(r => Array.isArray(r.brands) && r.brands.includes(brandName)).length;
                return (
                  <button
                    key={`brand-filter-${brandName}-${bIdx}`}
                    onClick={() => setSelectedBrand(brandName)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 border flex items-center gap-1.5 ${
                      selectedBrand === brandName
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs font-black"
                        : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
                    }`}
                  >
                    <span>{brandName}</span>
                    {count > 0 && <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-mono font-bold">{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 3. REPRESENTATIVES CONTENT TRACK (CAROUSEL OR GRID)                       */}
        {/* ========================================================================= */}
        {filteredReps.length > 0 ? (
          <div
            ref={scrollContainerRef}
            className={
              viewMode === 'carousel'
                ? "flex flex-row overflow-x-auto gap-4 sm:gap-5 pb-4 pt-1 snap-x snap-mandatory scroll-smooth no-scrollbar"
                : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            }
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {filteredReps.map((rep, idx) => {
              const tierData = calculateDealershipTier(rep.city || "تهران", rep.province);
              const isAuthorized = userBadge === 'admin' || (userCity && rep.city && (rep.city.includes(userCity) || userCity.includes(rep.city)));

              return (
                <div
                  key={`rep-card-${rep.id || idx}-${rep.city}`}
                  onClick={() => {
                    setSelectedRepForDetails(rep);
                    setModalTab('profile');
                  }}
                  className={`bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-500/50 transition-all duration-300 p-5 flex flex-col justify-between relative overflow-hidden cursor-pointer group ${
                    viewMode === 'carousel' 
                      ? "min-w-[290px] sm:min-w-[325px] max-w-[340px] shrink-0 snap-start" 
                      : "w-full"
                  }`}
                >
                  {/* Subtle Corner Glow Accent */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />

                  <div>
                    {/* Top Demographic Tier & Verification Strip */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-[10.5px] font-black border border-slate-200">
                        <MapPin size={12} className="text-emerald-600" />
                        <span>{rep.city || 'شهر مرکزی'}</span>
                        <span className="text-slate-500 font-medium">({getProvinceForCity(rep.city, rep.province) || 'استان'})</span>
                      </span>

                      {rep.badge === "برند دست اول" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 text-[10px] font-black border border-amber-500 shadow-sm">
                          <Crown size={12} className="fill-slate-950" />
                          <span>برند دست اول 👑</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-[10px] font-bold border border-emerald-200">
                          <CheckCircle2 size={11} className="text-white" />
                          <span>{rep.badge || "عاملیت رسمی"}</span>
                        </span>
                      )}
                    </div>

                    {/* Representative Info */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 shadow-2xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <Building2 size={22} />
                      </div>
                      <div className="space-y-0.5 flex-1 overflow-hidden">
                        <h4 className="text-sm font-black text-slate-900 truncate group-hover:text-emerald-800 transition-colors">
                          {rep.company || rep.name || 'دفتر عاملیت پخش'}
                        </h4>
                        <p className="text-xs font-medium text-slate-500 truncate">
                          مدیریت: {rep.name || 'مدیر عاملیت منطقه'}
                        </p>
                      </div>
                    </div>

                    {/* Represented Brands: Creative Logo Strip */}
                    {rep.brands && Array.isArray(rep.brands) && rep.brands.length > 0 && (
                      <div className="mb-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-black">برندهای تحت پوشش:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {rep.brands.map((bName: string, bIdx: number) => {
                            const factory = b2bConfig?.factories?.find((f: any) => 
                              f.name?.toLowerCase().includes(bName.toLowerCase()) || 
                              bName.toLowerCase().includes(f.name?.toLowerCase()) ||
                              f.ownedBrands?.some((ob: string) => ob.toLowerCase() === bName.toLowerCase())
                            );
                            const logo = factory?.logoUrl;
                            
                            return (
                              <div
                                key={`card-b-${bName}-${bIdx}`}
                                className="group/brand flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white border border-slate-100 shadow-sm hover:border-emerald-300 transition-all"
                              >
                                {logo ? (
                                  <img 
                                    src={logo} 
                                    alt={bName} 
                                    className="w-4 h-4 object-contain mix-blend-multiply" 
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                )}
                                <span className="text-[10px] font-black text-slate-700">{bName}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Compact Quota & Performance Box */}
                    <div className="bg-emerald-50/40 rounded-2xl p-3 border border-emerald-100/50 space-y-2 mb-4">
                      <div className="flex justify-between items-center text-slate-600 font-medium">
                        <span className="flex items-center gap-1.5 text-slate-500 text-[11px] font-black">
                          <Package size={12} className="text-emerald-600" />
                          حداقل سفارش ورود:
                        </span>
                        <span className="font-black text-emerald-800 text-[11px] bg-white px-2 py-0.5 rounded-lg border border-emerald-100">
                          {tierData.starterMinCartons}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-slate-600 font-medium border-t border-emerald-100/30 pt-2">
                        <span className="flex items-center gap-1.5 text-slate-500 text-[11px] font-black">
                          <Coins size={12} className="text-emerald-500" />
                          سقف سهمیه منطقه:
                        </span>
                        <span className="font-black text-slate-800 text-[11px]">
                          {tierData.monthlyQuotaCeilingFormatted}
                        </span>
                      </div>
                    </div>

                    {/* Address with High Contrast */}
                    <div className="text-[11px] text-slate-600 font-bold leading-relaxed mb-4 min-h-[32px] flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <MapPin size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{rep.address || `دفتر رسمی توزیع و پخش کالا در حوزه ${rep.city}`}</span>
                    </div>
                  </div>

                  {/* Direct Calling & View Details Action */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs font-black font-mono ${isAuthorized ? 'text-emerald-700' : 'text-slate-400 blur-[3px] select-none'}`} dir="ltr">
                        {isAuthorized ? (rep.phone || rep.tel) : "۰۹۱۲*******"}
                      </span>
                      {isAuthorized && (
                        <button
                          onClick={() => handleCopyPhone(rep.phone || rep.tel)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
                          title="کپی شماره"
                        >
                          {copiedPhone === (rep.phone || rep.tel) ? <Check size={12} className="text-emerald-600" /> : <Share2 size={12} />}
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRepForDetails(rep);
                        setModalTab('profile');
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer border border-slate-200/80"
                    >
                      <Award size={12} className="text-emerald-600" />
                      <span>مشاهده شناسنامه و گواهی</span>
                    </button>
                  </div>

                </div>
              );
            })}

            {/* Dealership Invitation Card - 100% Clean White, Creative & Compact */}
            <div className={`bg-white text-slate-900 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-xs relative overflow-hidden border border-emerald-200 ${
              viewMode === 'carousel'
                ? "min-w-[280px] sm:min-w-[310px] shrink-0 snap-start"
                : "w-full min-h-[300px]"
            }`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
              
              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                    <Sparkles size={20} />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white border border-emerald-200 text-[10px] font-black">
                    تکمیل ظرفیت عاملیت
                  </span>
                </div>
                
                <h4 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                  شهر شما هنوز عاملیت فعال ندارد؟
                </h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  عاملیت انحصاری توزیع محصولات کارخانجات برتر را با شروع آسان از ۳۰ کارتن و ارتقای خودکار پلکانی اخذ نمایید.
                </p>
                <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] font-bold text-emerald-800">
                  ✓ اعطای گواهینامه معتبر رسمی + کاتالوگ و نمایندگی برندها
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenDealership()}
                className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs relative z-10 active:scale-95"
              >
                <span>ثبت درخواست عاملیت شهر شما</span>
                <ArrowLeft size={14} />
              </button>
            </div>

          </div>
        ) : (
          /* Empty Search Results Box / Nearest Representative Suggestion */
          <div className="w-full space-y-4">
            {nearestRepData && nearestRepData.nearestMatches.length > 0 && (
              <div className="bg-emerald-50/90 border border-emerald-200 rounded-3xl p-5 sm:p-6 text-right space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-emerald-200/80 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-2xs">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">
                        در شهر یا فیلتر انتخابی شما ({searchTerm || (selectedProvince !== 'all' ? selectedProvince : 'شهر موردنظر')}) نماینده مستقیم ثبت نشده است
                      </h3>
                      <p className="text-xs text-emerald-900 font-bold mt-0.5">
                        پیشنهاد هوشمند: نزدیک‌ترین نماینده فعال استانی در شهر <span className="font-black text-emerald-950 underline underline-offset-4">{nearestRepData.nearestCityName}</span> آماده ارسال سریع و تحویل سفارش است:
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenDealership(searchTerm)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5 shrink-0 active:scale-95"
                  >
                    <Sparkles size={14} />
                    <span>درخواست اخذ نمایندگی جدید در {searchTerm || 'شهر شما'}</span>
                  </button>
                </div>

                {/* Render Nearest Matches Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                  {nearestRepData.nearestMatches.map((rep, nIdx) => {
                    const tierData = calculateDealershipTier(rep.city || "تهران", rep.province);
                    return (
                      <div
                        key={`nearest-rep-${rep.id || nIdx}`}
                        onClick={() => {
                          setSelectedRepForDetails(rep);
                          setModalTab('profile');
                        }}
                        className="bg-white rounded-2xl p-4 border border-emerald-200/90 shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10.5px] font-black px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 flex items-center gap-1">
                            <MapPin size={11} />
                            {rep.city} ({rep.province})
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            نزدیک‌ترین مرکز
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs font-black text-slate-900">{rep.company || rep.name}</h4>
                          <p className="text-[11px] text-slate-500">مدیریت: {rep.name}</p>
                        </div>

                        <div className="text-[10.5px] text-slate-600 bg-slate-50 p-2 rounded-xl font-mono flex justify-between">
                          <span>سقف سهمیه تحویل:</span>
                          <span className="font-bold text-emerald-800">{tierData.monthlyQuotaCeilingFormatted}</span>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="font-mono text-emerald-800 font-bold" dir="ltr">{rep.phone || rep.tel}</span>
                          <span className="text-[10.5px] font-bold text-emerald-700 hover:underline">مشاهده جزییات و تماس ←</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="w-full bg-white rounded-3xl p-8 sm:p-10 text-center border border-slate-200 shadow-xs flex flex-col items-center justify-center space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl">
                <Search size={22} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-800">
                  {nearestRepData && nearestRepData.nearestMatches.length > 0
                    ? `نماینده مستقیم در ${searchTerm || selectedProvince} ثبت نشده است`
                    : "نماینده‌ای مطابق با فیلترها یافت نشد"}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  می‌توانید فیلتر استان یا برند را تغییر دهید یا به عنوان اولین عاملیت رسمی در شهر خود درخواست ثبت کنید.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenDealership(searchTerm)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-2 active:scale-95"
              >
                <Sparkles size={14} />
                <span>درخواست عاملیت در این شهر</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 4. DEDICATED REPRESENTATIVE PROFILE & OFFICIAL CERTIFICATE MODAL           */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedRepForDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-3xl rounded-[2rem] border border-slate-200 shadow-2xl p-5 sm:p-7 space-y-5 text-right font-sans my-auto max-h-[92vh] overflow-y-auto"
              dir="rtl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
                    <Award size={26} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {selectedRepForDetails.company || selectedRepForDetails.name || 'شناسنامه رسمی نماینده'}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold">
                      کد شناسایی عاملیت: <span className="font-mono text-emerald-700 font-black">{selectedRepForDetails.agencyCode || 'AGN-1405-OFFICIAL'}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedRepForDetails(null)}
                  className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Tabs Switcher: Profile vs Official Certificate */}
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl">
                <button
                  onClick={() => setModalTab('profile')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    modalTab === 'profile'
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Briefcase size={15} className="text-emerald-600" />
                  <span>شناسنامه و برندهای عاملیت</span>
                </button>

                <button
                  onClick={() => setModalTab('certificate')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    modalTab === 'certificate'
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Award size={15} className="text-emerald-500" />
                  <span>گواهینامه رسمی و چاپی عاملیت</span>
                </button>
              </div>

              {/* TAB 1: PROFILE & BRANDS */}
              {modalTab === 'profile' && (
                <div className="space-y-4">
                  {/* Top Metadata Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold block">موقعیت دفتر</span>
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                        <MapPin size={13} className="text-emerald-600" />
                        {selectedRepForDetails.city} - {getProvinceForCity(selectedRepForDetails.city, selectedRepForDetails.province)}
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold block">مدیریت عاملیت</span>
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                        <Users size={13} className="text-emerald-600" />
                        {selectedRepForDetails.name || 'مدیر رسمی'}
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold block">وضعیت اعتبار</span>
                      <span className="text-xs font-black text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        تایید شده رسمی دست اول
                      </span>
                    </div>
                  </div>

                  {/* Represented Brands Showcase */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <Tag size={14} className="text-emerald-600" />
                        <span>برندهای دارای عاملیت توزیع رسمی:</span>
                      </h4>
                      <span className="text-[10px] font-bold text-slate-500">
                        {selectedRepForDetails.brands?.length || 0} کارخانه و برند رسمی
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedRepForDetails.brands && Array.isArray(selectedRepForDetails.brands) && selectedRepForDetails.brands.length > 0 ? (
                        selectedRepForDetails.brands.map((brandName: string, bIdx: number) => (
                          <span
                            key={`modal-b-${brandName}-${bIdx}`}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 text-xs font-black border border-emerald-200 flex items-center gap-1.5"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>{brandName}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">تمامی برندها و کارخانجات پلتفرم دست اول</span>
                      )}
                    </div>
                  </div>

                  {/* Quota & Capacity Overview */}
                  {(() => {
                    const tierData = calculateDealershipTier(selectedRepForDetails.city || "تهران", selectedRepForDetails.province);
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 font-bold block">شروع ورود اولیه:</span>
                          <span className="text-xs font-black text-emerald-800">{tierData.starterMinCartons}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 font-bold block">توزیع ماهانه منطقه:</span>
                          <span className="text-xs font-black text-slate-800">{tierData.monthlyCartons}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 font-bold block">سقف سهمیه پلکانی:</span>
                          <span className="text-xs font-black text-emerald-700 font-mono">{tierData.monthlyQuotaCeilingFormatted}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Contact Info & Address */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-bold text-slate-700">آدرس پستی دفتر انبار و پخش:</span>
                      <a
                        href={`tel:${selectedRepForDetails.phone || selectedRepForDetails.tel}`}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-2xs"
                      >
                        <Phone size={13} />
                        <span>تماس مستقیم با نماینده ({selectedRepForDetails.phone || selectedRepForDetails.tel})</span>
                      </a>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {selectedRepForDetails.address || `دفتر مرکزی توزیع و عاملیت رسمی در استان ${selectedRepForDetails.province} و شهر ${selectedRepForDetails.city}`}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: OFFICIAL PRINTABLE CERTIFICATE */}
              {modalTab === 'certificate' && (
                <div className="space-y-4">
                  {/* Action Buttons for PDF and Print */}
                  <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-600 pr-2">
                      گواهی‌نامه رسمی دارای شناسه صیادی و QR کد اعتبارسنجی
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePrintCertificate}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                      >
                        <Printer size={13} />
                        <span>چاپ مستقیم گواهی</span>
                      </button>

                      <button
                        onClick={() => setShareModalRep(selectedRepForDetails)}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                        title="اشتراک‌گذاری پروانه عاملیت در تلگرام و واتساپ"
                      >
                        <Share2 size={13} />
                        <span>اشتراک‌گذاری پروانه</span>
                      </button>
                    </div>
                  </div>

                  {/* High-Resolution Printable Certificate Frame */}
                  <div className="overflow-x-auto p-1">
                    <div
                      ref={certificateRef}
                      className="bg-white border-8 border-emerald-600/25 p-6 sm:p-8 rounded-3xl relative text-slate-900 shadow-sm w-[760px] min-w-[760px] mx-auto"
                      style={{
                        backgroundImage: "radial-gradient(#f8fafc 15%, transparent 16%)",
                        backgroundSize: "20px 20px"
                      }}
                    >
                      {/* Outer Decorative Gold Border */}
                      <div className="border-2 border-dashed border-emerald-500/40 p-5 rounded-2xl space-y-5 relative">
                        
                        {/* Certificate Header */}
                        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-amber-700">
                              <Award size={32} />
                            </div>
                            <div>
                              <h2 className="text-lg font-black text-slate-900">پلتفرم کشوری دست اول</h2>
                              <p className="text-[11px] font-bold text-amber-800">سامانه جامع توزیع مستقیم کارخانجات سراسر کشور</p>
                            </div>
                          </div>

                          <div className="text-left space-y-0.5">
                            <span className="text-[10px] text-slate-400 font-bold block">شماره استعلام:</span>
                            <span className="font-mono text-xs font-black text-indigo-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                              {selectedRepForDetails.agencyCode || 'AGN-1405-7721'}
                            </span>
                            <span className="text-[9.5px] text-slate-500 font-bold block">تاریخ اعطا: ۱۴۰۵/۰۱/۰۱</span>
                          </div>
                        </div>

                        {/* Certificate Title */}
                        <div className="text-center space-y-1.5 py-1">
                          <span className="px-3.5 py-0.5 rounded-full bg-emerald-100/70 text-amber-900 text-[11px] font-black border border-amber-300">
                            گواهی‌نامه رسمی اعطای عاملیت و نمایندگی توزیع
                          </span>
                          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight pt-1">
                            حکم نمایندگی رسمی در حوزه {selectedRepForDetails.city}
                          </h3>
                        </div>

                        {/* Certificate Body Text */}
                        <div className="text-xs text-slate-700 leading-relaxed space-y-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70">
                          <p>
                            بدین‌وسیله تایید می‌گردد که جناب آقای / مجموعه محترم <strong className="text-slate-950 font-black">{selectedRepForDetails.name}</strong> ({selectedRepForDetails.company || 'دفتر عاملیت منطقه'})، پس از احراز صلاحیت‌های حرفه‌ای و اعتبارسنجی صنفی، به عنوان <strong className="text-emerald-800 font-black">نماینده رسمی و دفتر عاملیت مجاز پلتفرم دست اول</strong> در حوزه جغرافیایی <strong className="text-slate-950 font-black">شهرستان {selectedRepForDetails.city} (استان {getProvinceForCity(selectedRepForDetails.city, selectedRepForDetails.province)})</strong> منصوب گردیده‌اند.
                          </p>
                          <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-800 text-[11px]">برندهای تحت عاملیت رسمی:</span>
                            {selectedRepForDetails.brands && Array.isArray(selectedRepForDetails.brands) ? (
                              selectedRepForDetails.brands.map((b: string, i: number) => (
                                <span key={`cert-brand-${b}-${i}`} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 font-bold text-[10.5px]">
                                  {b}
                                </span>
                              ))
                            ) : (
                              <span className="font-bold text-slate-600">کلیه برندهای رسمی</span>
                            )}
                          </div>
                        </div>

                        {/* Certificate Signatures & QR Seal */}
                        <div className="flex items-center justify-between pt-3 border-t border-emerald-500/20">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                              <QRCodeSVG
                                value={`https://dastavval.com/rep/verify/${selectedRepForDetails.agencyCode || 'AGN-1405'}`}
                                size={55}
                                level="M"
                              />
                            </div>
                            <div className="text-[10px] text-slate-500 font-bold space-y-0.5">
                              <span className="block text-emerald-700 font-black">✓ اعتبارسنجی آنی با اسکن بارکد</span>
                              <span>پایگاه داده نمایندگان رسمی</span>
                            </div>
                          </div>

                          <div className="text-center space-y-1">
                            <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-amber-400 flex items-center justify-center mx-auto text-amber-700 shadow-inner">
                              <ShieldCheck size={32} />
                            </div>
                            <span className="text-[10px] font-black text-slate-700 block">مهر برجسته و دبیرخانه مرکزی</span>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShareModalRep(selectedRepForDetails)}
                  className="px-4 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                  title="اشتراک‌گذاری پروانه عاملیت در تلگرام و واتساپ"
                >
                  <Share2 size={14} className="text-teal-600" />
                  <span>اشتراک‌گذاری پروانه عاملیت</span>
                </button>

                <button
                  onClick={() => setSelectedRepForDetails(null)}
                  className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition-all cursor-pointer"
                >
                  بستن پنجره
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share License Modal */}
      <RepresentativeShareLicenseModal
        rep={shareModalRep}
        isOpen={!!shareModalRep}
        onClose={() => setShareModalRep(null)}
        b2bConfig={b2bConfig}
      />

    </section>
  );
}
