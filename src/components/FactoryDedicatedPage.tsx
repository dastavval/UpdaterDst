import React, { useState, useRef } from "react";
import { getDisplayImageUrl } from "../lib/image-utils";
import { motion, AnimatePresence } from "motion/react";
import StarRating from "./StarRating";
import { QRCodeSVG } from "qrcode.react";
import { 
  Building2, 
  MapPin, 
  ShieldCheck, 
  ShoppingBag, 
  Star, 
  FileText, 
  Download, 
  Sparkles, 
  ExternalLink,
  X,
  Eye,
  MessageSquare,
  MessageCircle,
  Award,
  PhoneCall,
  Share2,
  Copy,
  Check,
  QrCode,
  Printer,
  ChevronLeft,
  Boxes,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Globe,
  Mail,
  Zap,
  Truck,
  ArrowUpRight,
  Maximize2,
  TrendingDown
} from "lucide-react";
import { FactoryProfile, Product, FactoryReview } from "../types";
import FactoryChatSystem from "./FactoryChatSystem";

interface FactoryDedicatedPageProps {
  factory: FactoryProfile;
  products?: Product[];
  onClose: () => void;
  onSelectProductForOrder?: (product: Product) => void;
  onDirectOrderFactory?: (factoryName: string) => void;
  b2bConfig?: any;
  userBadge?: string;
  user?: any;
}

export default function FactoryDedicatedPage({
  factory,
  products = [],
  onClose,
  onSelectProductForOrder,
  onDirectOrderFactory,
  b2bConfig,
  userBadge,
  user
}: FactoryDedicatedPageProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'gallery' | 'products' | 'certificates' | 'reviews' | 'qrcode' | 'raw_materials'>('overview');
  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState<string>('all');
  const [activeLightboxImage, setActiveLightboxImage] = useState<{ url: string; title: string } | null>(null);
  
  // Link & Share state
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // Review submission form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerCity, setReviewerCity] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [localReviews, setLocalReviews] = useState<FactoryReview[]>(() => {
    const key = `dastavval_factory_reviews_${factory.id || factory.name}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return factory.reviews || [
      { id: "r1", userName: "علی احمدی", userCity: "تهران", rating: 5, comment: "ما دو ساله مستقیم از این کارخونه خرید عمده داریم. زمان‌بندی دقیق و کالا به شدت دست اول است.", createdAt: "۱۴۰۳/۰۴/۱۵", isVerifiedBuyer: true },
      { id: "r2", userName: "رضا محمدی", userCity: "تبریز", rating: 4, comment: "بهترین قیمت رقابتی مزمز در بازار. کاش بسته‌بندی کارتن‌های مادر کمی ضخیم‌تر می‌بود.", createdAt: "۱۴۰۳/۰۵/۱۰", isVerifiedBuyer: true }
    ];
  });

  const computedRating = localReviews.length > 0 
    ? parseFloat((localReviews.reduce((sum, r) => sum + r.rating, 0) / localReviews.length).toFixed(1))
    : (factory.rating || 4.8);

  // Dedicated URL for this factory
  const factorySlug = factory.slug || factory.id || `factory-${encodeURIComponent(factory.name)}`;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://dastavval.com';
  const factoryDedicatedUrl = `${baseUrl}/?factory=${factory.id}`;

  // Dynamic gallery from actual photos if available
  const customGallery = [];
  if (factory.factoryExteriorPhoto || factory.coverUrl) {
    customGallery.push({
      url: factory.factoryExteriorPhoto || factory.coverUrl || "",
      title: "عکس محوطه و نمای کارخانه",
      category: "exterior"
    });
  }
  if (factory.productionLinePhoto) {
    customGallery.push({
      url: factory.productionLinePhoto,
      title: "خط تولید و ماشین‌آلات",
      category: "production"
    });
  }
  if (factory.warehousePhoto) {
    customGallery.push({
      url: factory.warehousePhoto,
      title: "انبار مرکزی و نگهداری کالا",
      category: "warehouse"
    });
  }
  if (factory.certificatesPhoto) {
    customGallery.push({
      url: factory.certificatesPhoto,
      title: "ایزوها و گواهینامه‌ها",
      category: "lab"
    });
  }

  // Default photo gallery images if not provided
  const defaultGallery = [
    {
      url: factory.coverUrl || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80",
      title: "خط تولید اتوماتیک و بسته‌بندی پیشرفته",
      category: "production"
    },
    {
      url: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80",
      title: "دستگاه‌های مدرن فرم‌دهی و فرآوری",
      category: "machinery"
    },
    {
      url: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80",
      title: "انبار مرکزی مکانیزه و بارگیری ریلی و جاده‌ای",
      category: "warehouse"
    },
    {
      url: "https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&w=1200&q=80",
      title: "آزمایشگاه تخصصی کنترل کیفیت و ماندگاری",
      category: "lab"
    },
    {
      url: factory.logoUrl || "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=1200&q=80",
      title: "نمای محوطه و سالن اصلی کارخانه",
      category: "exterior"
    }
  ];

  const galleryList = (factory.galleryImages && factory.galleryImages.length > 0)
    ? factory.galleryImages
    : (customGallery.length > 0 ? customGallery : defaultGallery);

  // Filter gallery images
  const filteredGallery = selectedGalleryCategory === 'all'
    ? galleryList
    : galleryList.filter(item => item.category === selectedGalleryCategory);

  // Filter products matching this factory
  const factoryProducts = products.filter(p => 
    p.sellerName?.toLowerCase().includes(factory.name.toLowerCase()) ||
    factory.name?.toLowerCase().includes(p.brand?.toLowerCase() || '') ||
    factory.mainProducts?.some(mp => p.name.includes(mp) || mp.includes(p.name))
  );

  // Dynamic health license
  const customCertificates = [];
  if (factory.healthLicense || factory.factoryHealthLicense) {
    customCertificates.push({
      name: `سیب سلامت / پروانه بهداشت: ${factory.healthLicense || factory.factoryHealthLicense}`,
      issuer: "سازمان غذا و دارو ایران",
      year: "دارای اعتبار جاری"
    });
  }

  // Default certificates list
  const defaultCertificates = (factory.certificates && factory.certificates.length > 0)
    ? factory.certificates
    : [
        ...customCertificates,
        { name: "سیب سلامت (پروانه بهداشتی ساخت)", issuer: "سازمان غذا و دارو", year: "۱۴۰۲" },
        { name: "گواهینامه مدیریت کیفیت ISO 9001:2015", issuer: "توف آلمان (TÜV)", year: "۲۰۲۳" },
        { name: "گواهی ایمنی مواد غذایی HACCP / ISO 22000", issuer: "استاندارد بین‌المللی", year: "۲۰۲۲" },
        { name: "نشان ملی استاندارد ایران", issuer: "سازمان ملی استاندارد", year: "پیوسته" },
        { name: "گواهینامه حلال بین‌المللی (Halal)", issuer: "مرکز تحقیقات حلال", year: "۱۴۰۲" }
      ];

  // Copy link handler
  const handleCopyLink = () => {
    navigator.clipboard.writeText(factoryDedicatedUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Download QR Code as PNG image
  const handleDownloadQR = () => {
    const svgElement = document.getElementById("factory-qr-code-svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 1000;
      canvas.height = 1000;
      if (ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 100, 100, 800, 800);

        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `QR-${factory.name.replace(/\s+/g, "_")}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Handle Review Submission
  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewComment.trim()) return;

    const newRev: FactoryReview = {
      id: `rev-${Date.now()}`,
      userName: reviewerName.trim(),
      userCity: reviewerCity.trim() || "عمده‌فروش همکار",
      rating: reviewRating,
      comment: reviewComment.trim(),
      createdAt: new Date().toLocaleDateString('fa-IR'),
      isVerifiedBuyer: true
    };

    const updated = [newRev, ...localReviews];
    setLocalReviews(updated);
    const key = `dastavval_factory_reviews_${factory.id || factory.name}`;
    localStorage.setItem(key, JSON.stringify(updated));
    setShowReviewForm(false);
    setReviewerName("");
    setReviewerCity("");
    setReviewComment("");
  };

  const logoImage = getDisplayImageUrl(factory.logoUrl || factory.logo || "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=200&q=80");
  const coverImage = getDisplayImageUrl(factory.coverUrl || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80");

  // Advanced Profile Injection
  React.useEffect(() => {
    if (factory.profileDesignMode === 'advanced' && factory.customJs) {
      try {
        const script = document.createElement('script');
        script.textContent = factory.customJs;
        script.id = `factory-js-${factory.id || 'current'}`;
        document.body.appendChild(script);
        return () => {
          const oldScript = document.getElementById(`factory-js-${factory.id || 'current'}`);
          if (oldScript) oldScript.remove();
        };
      } catch (e) {
        console.error("Factory Custom JS Error:", e);
      }
    }
  }, [factory.profileDesignMode, factory.customJs, factory.id]);

  if (factory.profileDesignMode === 'advanced' && factory.customHtml) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-indigo-600 font-sans" dir="rtl">
        {factory.customCss && (
          <style dangerouslySetInnerHTML={{ __html: factory.customCss }} />
        )}
        
        {/* Navigation Overlay for Advanced Mode to allow exit */}
        <div className="fixed top-4 left-4 z-[60] flex items-center gap-2">
           <button
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md flex items-center justify-center shadow-2xl border border-white/30 transition-all cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        <div 
          className="min-h-screen"
          dangerouslySetInnerHTML={{ __html: factory.customHtml }} 
        />

        {/* Fallback ordering button if not in custom HTML */}
        <div className="fixed bottom-6 right-6 z-50">
           <button
              onClick={() => {
                if (onDirectOrderFactory) onDirectOrderFactory(factory.name);
                onClose();
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-2 transition-all"
            >
              <ShoppingBag size={20} />
              <span>ثبت سفارش مستقیم از این کارخانه</span>
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-400/50 backdrop-blur-sm p-2 sm:p-4 md:p-6 font-sans text-right" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 25, scale: 0.98 }}
        className="max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden relative my-2 sm:my-6 pb-8"
      >
        {/* Top Control Bar */}
        <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="bg-white/90 hover:bg-white text-slate-800 backdrop-blur-md font-black px-3.5 py-2 rounded-2xl text-xs shadow-lg border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
            title="کپی لینک مستقیم صفحه کارخانه"
          >
            {copiedLink ? <Check size={16} className="text-emerald-600" /> : <Share2 size={16} className="text-emerald-600" />}
            <span>{copiedLink ? "لینک کپی شد!" : <span className="hidden sm:inline">اشتراک‌گذاری</span>}</span>
          </button>

          <button
            onClick={() => setShowQRModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3.5 py-2 rounded-2xl text-xs shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
            title="نمایش QR کد اختصاصی"
          >
            <QrCode size={16} />
            <span className="hidden sm:inline">QR کد اختصاصی</span>
          </button>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/90 hover:bg-white text-slate-700 backdrop-blur-md flex items-center justify-center shadow-lg border border-slate-200 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* HERO COVER BANNER */}
        <div className="relative h-44 sm:h-80 w-full bg-slate-900 overflow-hidden">
          <img 
            src={coverImage} 
            alt={factory.name} 
            className="w-full h-full object-cover opacity-60 scale-105 transition-transform duration-700 hover:scale-100"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Banner Badges */}
          <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-1.5 max-w-[50%] sm:max-w-none">
            <span className="bg-emerald-500/95 backdrop-blur-md border border-emerald-400/40 text-slate-950 font-black text-[10px] sm:text-xs px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full shadow-lg flex items-center gap-1">
              <ShieldCheck size={14} className="sm:w-4 sm:h-4" />
              <span className="truncate">احراز هویت شده</span>
            </span>
            {factory.isPremium && (
              <span className="bg-amber-400/95 backdrop-blur-md border border-amber-300 text-slate-950 font-black text-[10px] sm:text-xs px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full shadow-lg flex items-center gap-1">
                <Award size={14} className="sm:w-4 sm:h-4" />
                <span>ممتاز</span>
              </span>
            )}
          </div>
        </div>

        {/* FACTORY PROFILE DETAILS CONTAINER */}
        <div className="relative px-4 pb-4 pt-4 sm:p-0 sm:absolute sm:-bottom-12 sm:left-6 sm:right-6 sm:z-20">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 w-full sm:w-auto">
              
              {/* Logo Container */}
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl sm:rounded-3xl bg-white p-1.5 sm:p-2 shadow-xl sm:shadow-2xl border-4 border-emerald-400 shrink-0 overflow-hidden relative flex items-center justify-center -mt-16 sm:mt-0 z-10 self-center sm:self-auto">
                {logoImage && typeof logoImage === 'string' && (logoImage.startsWith('http') || logoImage.startsWith('data:image/') || logoImage.startsWith('/') || logoImage.startsWith('.') || logoImage.includes('.') || logoImage.includes('/') || logoImage.includes('%2F')) ? (
                  <img 
                    src={logoImage} 
                    alt={factory.name} 
                    className="w-full h-full object-contain p-0.5 rounded-xl sm:rounded-2xl clean-logo-filter" 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const fb = parent.querySelector('.fac-hero-vector-fallback');
                        if (fb) (fb as HTMLElement).style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div 
                  className="fac-hero-vector-fallback absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white flex-col items-center justify-center p-2 text-center rounded-xl sm:rounded-2xl shadow-inner"
                  style={{ display: !logoImage || (typeof logoImage === 'string' && !(logoImage.startsWith('http') || logoImage.startsWith('data:image/') || logoImage.startsWith('/') || logoImage.startsWith('.') || logoImage.includes('.') || logoImage.includes('/') || logoImage.includes('%2F'))) ? 'flex' : 'none' }}
                >
                  <span className="text-2xl sm:text-3xl mb-0.5 sm:mb-1">🏭</span>
                  <span className="text-[10px] sm:text-xs font-black leading-tight text-amber-300 line-clamp-2">{factory.name}</span>
                </div>
              </div>

              {/* Textual Info */}
              <div className="space-y-1.5 text-slate-800 sm:text-white w-full sm:w-auto text-center sm:text-right mt-2 sm:mt-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="bg-emerald-600 sm:bg-emerald-600/80 backdrop-blur-md text-emerald-100 sm:text-emerald-50 text-[10px] sm:text-[11px] font-black px-2 py-0.5 sm:px-2.5 rounded">
                    {factory.category || "صنایع غذایی"}
                  </span>
                  <span className="text-[11px] sm:text-xs text-slate-500 sm:text-slate-300 font-bold">
                    تاسیس: {factory.establishedYear || "۱۳۸۰"}
                  </span>
                </div>
                
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 sm:text-white drop-shadow-none sm:drop-shadow-md leading-tight">
                  {factory.name}
                </h1>
                
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 text-xs text-slate-600 sm:text-slate-200 font-medium">
                  <span className="flex items-center gap-1 bg-slate-100 sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-full">
                    <MapPin size={13} className="text-emerald-600 sm:text-emerald-400" />
                    <span>{factory.location}</span>
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <div className="flex items-center gap-1.5 bg-slate-100 sm:bg-black/40 backdrop-blur-md px-2.5 py-1 sm:py-0.5 rounded-full border border-slate-200 sm:border-amber-400/40">
                    <StarRating 
                      rating={computedRating} 
                      size={13} 
                      interactive={true} 
                      showCount={true} 
                      count={localReviews.length}
                      onRate={(r) => {
                        setReviewRating(r);
                        setActiveTab('reviews');
                        setShowReviewForm(true);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action CTA */}
            <div className="w-full sm:w-auto mt-4 sm:mt-0 z-10">
              {onDirectOrderFactory && (
                <button
                  onClick={() => {
                    onDirectOrderFactory(factory.name);
                    onClose();
                  }}
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black px-6 py-3.5 sm:py-3 rounded-2xl text-xs sm:text-sm shadow-xl hover:shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag size={16} />
                  <span>ثبت سفارش مستقیم</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Clear spacer for desktop */}
        <div className="hidden sm:block h-16" />

        {/* NAVIGATION TABS BAR */}
        <div className="px-6 border-b border-slate-100 bg-slate-50/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-3">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-white hover:shadow-sm"
              }`}
            >
              <Building2 size={15} />
              <span>معرفی و اطلاعات کارخانه</span>
            </button>



            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'gallery'
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-white hover:shadow-sm"
              }`}
            >
              <ImageIcon size={15} />
              <span>گالری تصاویر ({galleryList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'products'
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-white hover:shadow-sm"
              }`}
            >
              <Boxes size={15} />
              <span>محصولات و کالاها ({factoryProducts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('certificates')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'certificates'
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-white hover:shadow-sm"
              }`}
            >
              <Award size={15} />
              <span>گواهی‌ها و سیب سلامت</span>
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'reviews'
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-white hover:shadow-sm"
              }`}
            >
              <MessageSquare size={15} />
              <span>نظرات خریداران ({localReviews.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('qrcode')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'qrcode'
                  ? "bg-amber-500 text-slate-950 shadow-md"
                  : "text-slate-600 hover:bg-white hover:shadow-sm"
              }`}
            >
              <QrCode size={15} />
              <span>لینک و QR کد اختصاصی</span>
            </button>

            <button
              onClick={() => setActiveTab('raw_materials')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'raw_materials'
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-white hover:shadow-sm"
              }`}
            >
              <Layers size={15} />
              <span>مواد اولیه و ملزومات مورد نیاز</span>
            </button>
          </div>
        </div>

        {/* TAB CONTENTS */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Description Card */}
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-6 bg-emerald-600 rounded-full" />
                  <h3 className="text-sm font-black text-slate-900">درباره خط تولید و فعالیت کارخانه</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                  {factory.factoryDescription || factory.description || factory.desc || "این مجتمع صنعتی از بزرگترین و مجهزترین خطوط تولید محصولات در منطقه بوده و دارای تمامی استانداردهای بهداشتی، خطوط بسته بندی تمام اتوماتیک و شبکه توزیع سراسری می‌باشد."}
                </p>
              </div>

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                    <Zap size={20} />
                  </div>
                  <span className="text-[11px] text-slate-400 font-bold block">ظرفیت تولید:</span>
                  <span className="text-sm font-black text-slate-900 block">{factory.dailyCapacity || factory.capacity || "۵,۰۰۰ کارتن در روز"}</span>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                    <Clock size={20} />
                  </div>
                  <span className="text-[11px] text-slate-400 font-bold block">شيفت‌های کاری:</span>
                  <span className="text-sm font-black text-slate-900 block">۳ شیفت کاری (پیوسته)</span>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-black">
                    <Truck size={20} />
                  </div>
                  <span className="text-[11px] text-slate-400 font-bold block">امکان ارسال بار:</span>
                  <span className="text-sm font-black text-slate-900 block">سراسر کشور (تریلی/خاور)</span>
                </div>
              </div>

              {/* Main Products List */}
              {factory.mainProducts && factory.mainProducts.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-black text-slate-900">محصولات اصلی خط تولید:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {factory.mainProducts.map((prod, idx) => (
                      <div key={`fact-dedicated-prod-${prod}-${idx}`} className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                        <span className="text-xs font-black text-emerald-950">{prod}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Photo Gallery Quick Teaser */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900">تصاویر خط تولید و ماشین‌آلات:</h3>
                  <button 
                    onClick={() => setActiveTab('gallery')}
                    className="text-xs text-emerald-700 font-black hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>مشاهده همه تصاویر ({galleryList.length})</span>
                    <ChevronLeft size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {galleryList.slice(0, 4).map((img, idx) => (
                    <div 
                      key={`fact-dedicated-gallery-${img.url || idx}-${idx}`}
                      onClick={() => setActiveLightboxImage(img)}
                      className="relative h-32 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer group"
                    >
                      <img src={getDisplayImageUrl(img.url)} alt={img.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-indigo-600/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 size={20} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location & Safe Platform Protection Info */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 flex items-center justify-between">
                  <span>مشخصات و موقعیت مکانی:</span>
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1">
                    <ShieldCheck size={14} />
                    <span>خرید با تضمین اصالت و قیمت دست‌اول سامانه</span>
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium text-slate-700">
                  <div className="space-y-2">
                    <p className="flex items-center gap-2">
                      <MapPin className="text-emerald-600 shrink-0" size={16} />
                      <span><strong>موقعیت کارخانه:</strong> {factory.location || "شهرک صنعتی (تحویل درب کارخانه و ارسال ترانزیت)"}</span>
                    </p>
                    <p className="flex items-center gap-2 text-slate-500">
                      <Building2 className="text-emerald-600 shrink-0" size={16} />
                      <span><strong>وضعیت ثبت:</strong> دارای پروانه بهره‌برداری و کد اختصاصی تامین‌کننده</span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="flex items-center gap-2 text-slate-800 font-bold">
                      <ShieldCheck className="text-emerald-600 shrink-0" size={16} />
                      <span><strong>کانال ثبت سفارش مستقیم:</strong> پرتال امن سامانه دست اول</span>
                    </p>
                    <p className="flex items-center gap-2 text-slate-600">
                      <MessageSquare className="text-emerald-600 shrink-0" size={16} />
                      <span><strong>استعلام قیمت و مذاکره:</strong> گفتگو و صدور پیش‌فاکتور آنلاین</span>
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[11px] text-emerald-900 font-bold leading-relaxed flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-700 shrink-0" />
                  <span>
                    جهت حفظ حقوق خریداران و تضمین تحویل بار با نرخ رسمی مصوب، کلیه استعلام‌های قیمت و سفارش‌گذاری‌ها منحصراً از طریق همین سامانه ثبت شده و شامل گارانتی لغو سفارش و بازگشت وجه می‌باشند.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GALLERY */}
          {activeTab === 'gallery' && (
            <div className="space-y-6">
              {/* Category Filters */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {[
                  { id: 'all', label: 'همه تصاویر' },
                  { id: 'production', label: 'خط تولید' },
                  { id: 'machinery', label: 'دستگاه‌ها و ماشین‌آلات' },
                  { id: 'warehouse', label: 'انبار و بارگیری' },
                  { id: 'lab', label: 'آزمایشگاه کیفیت' },
                  { id: 'exterior', label: 'محوطه کارخانه' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedGalleryCategory(cat.id)}
                    className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                      selectedGalleryCategory === cat.id
                        ? "bg-emerald-600 text-white shadow-md"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Photo Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredGallery.map((img, idx) => (
                  <motion.div
                    key={`fact-dedicated-filtered-gal-${img.url || idx}-${idx}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setActiveLightboxImage(img)}
                    className="group relative h-56 rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer shadow-sm hover:shadow-xl transition-all"
                  >
                    <img 
                      src={getDisplayImageUrl(img.url)} 
                      alt={img.title} 
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80";
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-90 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                      <span className="text-white font-black text-xs drop-shadow-md leading-snug">
                        {img.title}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {factoryProducts.length === 0 ? (
                <div className="bg-slate-50 rounded-3xl border border-dashed border-slate-300 p-8 text-center space-y-3">
                  <Boxes size={32} className="text-slate-400 mx-auto" />
                  <h4 className="text-sm font-black text-slate-800">کالاهای این کارخانه در حال بروزرسانی هستند</h4>
                  <p className="text-xs text-slate-500 font-bold max-w-md mx-auto">
                    جهت دریافت پیش‌فاکتور و لیست کامل اقلام موجود، مستقیماً با مدیریت فروش کارخانه تماس بگیرید.
                  </p>
                  {onDirectOrderFactory && (
                    <button
                      onClick={() => {
                        onDirectOrderFactory(factory.name);
                        onClose();
                      }}
                      className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-700 transition-all cursor-pointer shadow-md inline-flex items-center gap-2"
                    >
                      <ShoppingBag size={16} />
                      <span>ثبت سفارش عمده کالا</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {factoryProducts.map((product) => (
                    <div key={product.id} className="bg-white rounded-3xl p-4 border border-slate-200 flex gap-4 hover:border-emerald-300 transition-all shadow-sm">
                      <div className="w-24 h-24 rounded-2xl bg-slate-50 border border-slate-100 p-1 shrink-0 overflow-hidden">
                        <img src={getDisplayImageUrl(product.image_url)} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                      </div>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <h4 className="text-xs font-black text-slate-900 truncate">{product.name}</h4>
                        <p className="text-[10px] text-slate-500 font-bold">{product.pack_description || `هر کارتن ${product.carton_pack_count || 12} عددی`}</p>
                        
                        <div className="text-xs font-black text-emerald-700">
                          قیمت عمده: {product.price.toLocaleString('fa-IR')} تومان
                        </div>

                        <div className="pt-2 flex items-center justify-between">
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">
                            حداقل سفارش: {Math.max(5, product.min_order_cartons || 5)} کارتن
                          </span>

                          {onSelectProductForOrder && (
                            <button
                              onClick={() => {
                                onSelectProductForOrder(product);
                                onClose();
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1"
                            >
                              <ShoppingBag size={13} />
                              <span>سفارش</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CERTIFICATES */}
          {activeTab === 'certificates' && (
            <div className="space-y-6">
              <div className="bg-emerald-950 text-white p-6 rounded-3xl border border-emerald-500/30 space-y-2">
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 px-3 py-1 rounded-full text-xs font-black text-emerald-300">
                  <ShieldCheck size={16} />
                  <span>تاییدیه اصالت و مجوزهای قانونی</span>
                </div>
                <h3 className="text-base font-black text-white">گواهینامه‌های کیفی و بهداشتی کارخانه</h3>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  تمامی مجوزهای فوق توسط کارشناسان حقوقی سامانه دست‌اول استعلام شده و معتبر می‌باشند.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {defaultCertificates.map((cert, idx) => (
                  <div key={`fact-dedicated-cert-${cert.name || idx}-${idx}`} className="bg-white rounded-3xl p-5 border border-slate-200/80 flex items-start gap-4 shadow-sm hover:border-emerald-300 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black shrink-0 border border-amber-200">
                      <Award size={24} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-slate-900">{cert.name}</h4>
                      <p className="text-[11px] text-slate-500 font-bold">مرجع صادرکننده: {cert.issuer}</p>
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                        ✓ دارای اعتبار قانونی
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">نظرات و تجربیات ثبت شده بنکداران</h3>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">ثبت شده توسط خریداران واقعی محصولات کارخانه</p>
                </div>

                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl transition-all cursor-pointer shadow-md"
                >
                  {showReviewForm ? "بستن فرم" : "✍️ ثبت تجربه جدید"}
                </button>
              </div>

              {/* Review Submission Form */}
              <AnimatePresence>
                {showReviewForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddReview}
                    className="bg-slate-50 rounded-3xl p-6 border border-slate-200 space-y-4"
                  >
                    <h4 className="text-xs font-black text-slate-900">ثبت دیدگاه درباره این کارخانه:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-black text-slate-700 block mb-1">نام شما / نام مجموعه:</label>
                        <input
                          type="text"
                          required
                          value={reviewerName}
                          onChange={(e) => setReviewerName(e.target.value)}
                          placeholder="مثلاً: بنکداری حسینی"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-black text-slate-700 block mb-1">شهر محل فعالیت:</label>
                        <input
                          type="text"
                          value={reviewerCity}
                          onChange={(e) => setReviewerCity(e.target.value)}
                          placeholder="مثلاً: اصفهان"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-black text-slate-700 block mb-1">امتیاز کلی (از ۵):</label>
                      <select
                        value={reviewRating}
                        onChange={(e) => setReviewRating(Number(e.target.value))}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value={5}>⭐⭐⭐⭐⭐ (عالی - ۵)</option>
                        <option value={4}>⭐⭐⭐⭐ (خوب - ۴)</option>
                        <option value={3}>⭐⭐⭐ (متوسط - ۳)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-black text-slate-700 block mb-1">شرح تجربه و نظر شما:</label>
                      <textarea
                        required
                        rows={3}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="کیفیت بار، نحوه بسته بندی، زمان تحویل و برخورد فروش..."
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-md"
                    >
                      ثبت دیدگاه
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Reviews List */}
              <div className="space-y-3">
                {localReviews.map((rev) => (
                  <div key={rev.id} className="bg-white rounded-3xl p-5 border border-slate-200 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-slate-900">{rev.userName}</span>
                        <span className="text-[10px] text-slate-400 font-bold">({rev.userCity || "خریدار معتبر"})</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={`fact-dedicated-review-star-${i}`} size={13} className="fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">{rev.comment}</p>
                    <span className="text-[10px] text-slate-400 font-bold block pt-1">{rev.createdAt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: RAW MATERIALS REQUIRED BY FACTORY */}
          {activeTab === 'raw_materials' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 rounded-3xl border border-emerald-500/30 space-y-3">
                <div className="inline-flex items-center gap-2 bg-emerald-500/20 px-3 py-1 rounded-full text-xs font-black text-emerald-300">
                  <Layers size={16} />
                  <span>تامین مواد اولیه خط تولید</span>
                </div>
                <h3 className="text-base font-black text-white">مواد اولیه، افزودنی‌ها و ملزومات بسته‌بندی مورد نیاز {factory.name}</h3>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  تامین‌کنندگان معتبر مواد اولیه می‌توانند پیشنهاد قیمتی و پروفرما خود را مستقیماً برای واحد بازرگانی و خریدهای کارخانه ارسال کنند.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "روغن سرخ‌کردنی و صنعتی مخصوص", category: "مواد اولیه اصلی", volume: "۲۰ تن ماهانه", desc: "با تاییدیه بهداشتی و برگه آنالیز کیفی معتبر" },
                  { name: "آرد صنعتی (آرد ستاره/نول)", category: "مواد اولیه اصلی", volume: "۵۰ تن ماهانه", desc: "گلوتن بالا، پروتئین مناسب خطوط تولید بیسکویت و کیک" },
                  { name: "شکر سفید تصفیه‌شده صنعتی", category: "افزودنی‌ها", volume: "۱۵ تن ماهانه", desc: "بسته‌بندی کیسه ۵۰ کیلویی استاندارد" },
                  { name: "سلفون بسته‌بندی OPP/CPP چاپ‌شده", category: "ملزومات بسته‌بندی", volume: "۲ تن ماهانه", desc: "با قابلیت دوخت حرارتی بالا و چاپ فلکسو ۱۰ رنگ" },
                  { name: "کارتن ۵ لایه صادراتی و لایه‌دار", category: "ملزومات بسته‌بندی", volume: "۱۰,۰۰۰ عدد ماهانه", desc: "مقاوم در برابر رطوبت و فشار ترانزیت جاده‌ای" }
                ].map((item, idx) => (
                  <div key={`fact-dedicated-raw-mat-${item.name.slice(0, 10)}-${idx}`} className="bg-white rounded-3xl p-5 border border-slate-200/80 space-y-3 shadow-sm hover:border-emerald-300 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg">
                        {item.category}
                      </span>
                      <span className="text-xs font-black text-slate-700">حجم نیاز: {item.volume}</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900">{item.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                    <div className="w-full mt-2 py-2 bg-slate-50 text-slate-600 font-bold text-[11px] rounded-xl text-center border border-slate-100">
                      ثبت استعلام مستقیم از طریق سامانه دست اول
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'qrcode' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 border border-emerald-500/30 space-y-4">
                <div className="inline-flex items-center gap-2 bg-emerald-500/20 px-3 py-1 rounded-full text-xs font-black text-emerald-300">
                  <QrCode size={16} />
                  <span>شناسنامه و لینک دیجیتال کارخانه</span>
                </div>
                <h3 className="text-lg font-black text-white">QR کد و صفحه اختصاصی {factory.name}</h3>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  با چاپ این QR کد روی کارت ویزیت، کاتالوگ یا فاکتورهای رسمی، خریداران کلان می‌توانند مستقیماً وارد این صفحه شده و سفارشات خود را ثبت کنند.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 max-w-2xl mx-auto">
                {/* QR Display Frame */}
                <div ref={qrRef} className="bg-slate-50 p-6 rounded-3xl border-2 border-emerald-500/40 shadow-inner text-center space-y-3">
                  <div className="bg-white p-4 rounded-2xl shadow-md inline-block">
                    <QRCodeSVG 
                      id="factory-qr-code-svg"
                      value={factoryDedicatedUrl} 
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <span className="text-[10px] font-black text-emerald-800 block">اسکن جهت ورود مستقیم به صفحه کارخانه</span>
                </div>

                {/* Link and Share Controls */}
                <div className="space-y-4 flex-1 w-full">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">لینک اختصاصی صفحه:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={factoryDedicatedUrl}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-slate-700 dir-ltr text-left"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer shrink-0 shadow-md flex items-center gap-1"
                      >
                        {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                        <span>{copiedLink ? "کپی شد" : "کپی"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      onClick={handleDownloadQR}
                      className="w-full bg-indigo-600 hover:bg-slate-800 text-white font-black py-3 rounded-2xl text-xs transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                    >
                      <Download size={16} className="text-amber-400" />
                      <span>دانلود فایل تصویری QR کد (PNG)</span>
                    </button>

                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`صفحه اختصاصی و کاتالوگ ${factory.name} در سامانه دست‌اول:\n${factoryDedicatedUrl}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-2xl text-xs transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                    >
                      <Share2 size={16} />
                      <span>اشتراک‌گذاری در واتساپ / تلگرام</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* LIGHTBOX MODAL FOR FULLSCREEN IMAGE VIEW */}
      <AnimatePresence>
        {activeLightboxImage && (
          <div className="fixed inset-0 z-50 bg-slate-400/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative max-w-4xl w-full text-center space-y-3">
              <button
                onClick={() => setActiveLightboxImage(null)}
                className="absolute -top-12 left-0 text-white hover:text-amber-400 p-2 cursor-pointer"
              >
                <X size={28} />
              </button>
              <div className="bg-indigo-600 p-2 rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
                <img src={getDisplayImageUrl(activeLightboxImage.url)} alt={activeLightboxImage.title} className="max-h-[80vh] w-full object-contain mx-auto rounded-2xl" />
              </div>
              <p className="text-sm font-black text-white">{activeLightboxImage.title}</p>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* QR MODAL QUICK OVERLAY */}
      <AnimatePresence>
        {showQRModal && (
          <div className="fixed inset-0 z-50 bg-slate-400/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl relative"
            >
              <button
                onClick={() => setShowQRModal(false)}
                className="absolute top-4 left-4 text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto font-black">
                <QrCode size={24} />
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900">{factory.name}</h3>
                <p className="text-xs text-slate-500 font-bold mt-1">QR کد اختصاصی جهت ورود سریع خریداران</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl inline-block border border-slate-200">
                <QRCodeSVG 
                  value={factoryDedicatedUrl} 
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleDownloadQR}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  <span>دانلود تصویر QR کد</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-black py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                >
                  <Copy size={16} />
                  <span>{copiedLink ? "لینک کپی شد" : "کپی لینک"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
